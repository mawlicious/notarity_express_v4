import pLimit from "p-limit";
import qrcode from "qrcode-terminal";
import whatsappWeb from "whatsapp-web.js";
import type { Client as WhatsAppClient, Message } from "whatsapp-web.js";
import type { AgentService, Incoming } from "../agent/service.js";
import type { Config } from "../config.js";
import type { MediaStore } from "../media/store.js";

const { Client, LocalAuth, MessageMedia, MessageTypes } = whatsappWeb;

export const normalizeWhatsAppPhone = (value: string | undefined): string | undefined => {
  const raw = value?.split("@")[0]?.trim();
  if (!raw) return undefined;
  const digits = raw.replace(/\D/g, "");
  return digits || raw;
};

export class WhatsAppGateway {
  private client?: WhatsAppClient;
  private connectionState: "idle" | "connecting" | "open" | "closed" = "idle";
  private lastError?: string;
  private readonly lanes = new Map<string, ReturnType<typeof pLimit>>();

  constructor(private readonly config: Config, private readonly agent: AgentService, private readonly media: MediaStore) {}

  async start(): Promise<void> {
    this.connectionState = "connecting";
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: "notarity-express",
        dataPath: this.config.WHATSAPP_AUTH_PATH
      }),
      puppeteer: {
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
      }
    });
    this.client = client;
    client.on("qr", (qr) => {
      console.log("Scan this QR code from WhatsApp: Linked devices > Link a device");
      qrcode.generate(qr, { small: true });
    });
    client.on("ready", () => {
      console.log("WhatsApp bot is connected.");
      this.connectionState = "open";
      this.lastError = undefined;
    });
    client.on("auth_failure", (message) => {
      this.connectionState = "closed";
      this.lastError = message;
      console.error("WhatsApp authentication failed:", message);
    });
    client.on("disconnected", (reason) => {
      this.connectionState = "closed";
      this.lastError = reason;
      console.log(`WhatsApp disconnected: ${reason}. Reconnecting...`);
      void this.restart();
    });
    client.on("message", (message) => {
      void this.route(message).catch((error) => {
        console.error("WhatsApp message handling failed", {
          messageId: message.id.id,
          from: message.from,
          type: message.type,
          hasMedia: message.hasMedia,
          error: error instanceof Error
            ? { name: error.name, message: error.message, stack: error.stack, cause: error.cause }
            : error
        });
      });
    });
    await client.initialize();
  }

  async stop(): Promise<void> {
    const client = this.client;
    this.client = undefined;
    this.connectionState = "closed";
    if (client) {
      try {
        await client.destroy();
      } catch (error) {
        console.error("WhatsApp client shutdown failed:", error instanceof Error ? error.message : error);
      }
    }
  }

  private async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  async sendText(phone: string, text: string): Promise<void> {
    await this.sendTextToChat(`${phone}@c.us`, text);
  }

  private async sendTextToChat(chatId: string, text: string): Promise<void> {
    if (!text || !this.client || this.connectionState !== "open") return;
    try {
      await this.client.sendMessage(chatId, text);
    } catch (error) {
      console.error("WhatsApp send failed:", error instanceof Error ? error.message : error);
    }
  }

  private async route(message: Message): Promise<void> {
    if (message.fromMe || message.broadcast || message.isStatus || message.from.endsWith("@g.us")) return;
    const chatId = message.from;
    void this.markSeen(chatId);
    const phone = await this.phoneFor(message);
    const lane = this.lanes.get(phone) ?? pLimit(1);
    this.lanes.set(phone, lane);
    await lane(async () => {
      const chat = await message.getChat();
      const isVoice = message.type === MessageTypes.AUDIO || message.type === MessageTypes.VOICE;
      const activity = this.keepActivity(chat, isVoice);
      try {
        const incoming = await this.toIncoming(message, phone);
        const result = await this.agent.handle(incoming);
        if (result.voice) {
          await this.sendVoiceToChat(chatId, result.voice, result.text);
        } else {
          await this.sendTextToChat(chatId, result.text);
        }
      } finally {
        clearInterval(activity);
        await chat.clearState().catch(() => undefined);
      }
    });
  }

  private async phoneFor(message: Message): Promise<string> {
    const senderId = message.from;
    if (senderId.endsWith("@lid") && this.client) {
      try {
        const [resolved] = await this.client.getContactLidAndPhone([senderId]);
        const phone = normalizeWhatsAppPhone(resolved?.pn);
        if (phone) return phone;
      } catch (error) {
        console.warn("WhatsApp LID phone resolution failed; falling back to contact metadata", {
          from: message.from,
          error: error instanceof Error ? error.message : error
        });
      }
    }
    try {
      const contact = await message.getContact();
      const candidates = [
        contact.number,
        contact.id?.user,
        message.from
      ];
      for (const candidate of candidates) {
        const normalized = normalizeWhatsAppPhone(candidate);
        if (normalized) return normalized;
      }
    } catch (error) {
      console.warn("WhatsApp contact lookup failed; falling back to message sender id", {
        from: message.from,
        error: error instanceof Error ? error.message : error
      });
    }
    return normalizeWhatsAppPhone(message.from) ?? message.from;
  }

  private async markSeen(chatId: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.sendSeen(chatId);
    } catch (error) {
      console.error("WhatsApp mark-seen failed:", error instanceof Error ? error.message : error);
    }
  }

  private async sendVoiceToChat(
    chatId: string,
    voice: { data: Buffer; mimeType: string; fileName: string },
    fallbackText: string
  ): Promise<void> {
    if (!this.client || this.connectionState !== "open") return;
    try {
      const media = new MessageMedia(voice.mimeType, voice.data.toString("base64"), voice.fileName);
      await this.client.sendMessage(chatId, media, { sendAudioAsVoice: true });
    } catch (error) {
      console.error("WhatsApp voice send failed", {
        chatId,
        mimeType: voice.mimeType,
        bytes: voice.data.byteLength,
        error: error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack, cause: error.cause }
          : error
      });
      await this.sendTextToChat(chatId, fallbackText);
    }
  }

  private keepActivity(chat: Awaited<ReturnType<Message["getChat"]>>, recording: boolean): NodeJS.Timeout {
    const sendState = () => recording ? chat.sendStateRecording() : chat.sendStateTyping();
    void sendState().catch(() => undefined);
    return setInterval(() => {
      void sendState().catch(() => undefined);
    }, 15_000);
  }

  private async toIncoming(message: Message, phone: string): Promise<Incoming> {
    const id = message.id.id;
    if (message.type === MessageTypes.TEXT && message.body) return { id, phone, kind: "text", text: message.body };
    if ((message.type === MessageTypes.AUDIO || message.type === MessageTypes.VOICE) && message.hasMedia) {
      const media = await message.downloadMedia();
      const data = Buffer.from(media.data, "base64");
      const saved = await this.media.save(data, `${id}.ogg`, media.mimetype || "audio/ogg");
      return { id, phone, kind: "voice", mediaPath: saved.path, mimeType: media.mimetype || undefined };
    }
    if (message.type === MessageTypes.DOCUMENT && message.hasMedia) {
      const media = await message.downloadMedia();
      if (media.mimetype === "application/pdf") {
        const data = Buffer.from(media.data, "base64");
        const saved = await this.media.save(data, media.filename ?? `${id}.pdf`, media.mimetype);
        return { id, phone, kind: "pdf", mediaPath: saved.path, mimeType: media.mimetype };
      }
    }
    return { id, phone, kind: "unsupported" };
  }
}
