export class ElevenLabsClient {
  constructor(
    private readonly apiKey: string,
    private readonly voiceId: string,
    private readonly modelId: string
  ) {}

  get enabled(): boolean {
    return Boolean(this.apiKey);
  }

  async synthesize(text: string): Promise<Buffer> {
    if (!this.apiKey) throw new Error("ELEVENLABS_API_KEY is not configured");
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(this.voiceId)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "xi-api-key": this.apiKey
        },
        body: JSON.stringify({
          text,
          model_id: this.modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0,
            use_speaker_boost: true
          }
        })
      }
    );
    if (!response.ok) throw new Error(`ElevenLabs ${response.status}: ${await response.text()}`);
    return Buffer.from(await response.arrayBuffer());
  }
}
