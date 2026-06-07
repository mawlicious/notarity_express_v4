# Notarity Express

An agentic WhatsApp assistant that turns conversational requests into priced,
scheduled online notarization bookings for the **Notarity** track.

A submission for **START Hack Vienna '26**, built for the case provided by
**Notarity**.

---

## About

Notarity Express replaces a multi-page booking form with a natural WhatsApp
conversation. An OpenAI Agents SDK agent reads the live Notarity booking form,
resolves products and conditions, checks appointment availability, handles
documents and voice notes, prices the request, and prepares a debug submission.

## The challenge

The challenge was to reimagine Notarity's declarative booking-form flow while
still respecting the form schema, conditional products, server-side pricing,
timeslot labels, document requirements, and appointment-request payload.

## What we built

- An OpenAI Agents SDK booking agent with live Notarity API tools.
- WhatsApp text, PDF, and voice-note support through `whatsapp-web.js`.
- ElevenLabs voice replies when the user sends a voice message.
- Live product discovery, conditional timeslot lookup, pricing, drafts, and
  multipart debug submissions.
- Encrypted convenience profiles and memorable repeat workflows
- Per-user conversation serialization, read receipts, typing/recording
  indicators, retries, and verbose server-side diagnostics.

## Demo

- Live demo: Just talk to https://wa.me/+201113710796, or set it up personally if you want.

---

## Getting started

### Prerequisites

- Node.js 22
- Yarn 1.x
- A Convex account/deployment
- OpenAI API key
- ElevenLabs API key
- Access to the Notarity staging API
- A WhatsApp account that can link a web device

### Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd notarity_express_v2

# 2. Configure environment
cp .env.example .env.local
# fill in the required values (see .env.example)

# 3. Install dependencies
yarn

# 4. Push Convex functions
yarn convex:dev --once

# 5. Build
yarn build
```

### Run

```bash
yarn dev
```

Scan the terminal QR code from WhatsApp under **Linked devices → Link a
device**, then message the paired account.

---

## Project structure

```text
src/
  agent/       OpenAI Agents SDK orchestration, tools, and demo profile
  clients/     Notarity, OpenAI, ElevenLabs, and form-cache clients
  db/          Convex repository adapter
  domain/      Booking-form, condition, product, and time utilities
  media/       Local encrypted-permission media storage
  whatsapp/    whatsapp-web.js transport
convex/        Persistence, idempotency, profiles, sessions, and reminders
tests/         Domain, form-cache, and encryption tests
```

## Configuration

Important environment variables:

| Variable | Purpose |
| --- | --- |
| `CONVEX_URL` | Convex deployment URL |
| `OPENAI_API_KEY` | Agents SDK, transcription, and PDF extraction |
| `OPENAI_ROUTINE_MODEL` | Main booking-agent model |
| `OPENAI_RECOVERY_MODEL` | PDF extraction/recovery model |
| `ELEVENLABS_API_KEY` | Voice-note response synthesis |
| `ELEVENLABS_VOICE_ID` | ElevenLabs voice selection |
| `NOTARITY_BASE_URL` | Notarity staging API base URL |
| `NOTARITY_FORM_SLUG` | Booking form used as the source of truth |
| `ENCRYPTION_KEY_BASE64` | 32-byte base64 key for convenience profiles |
| `MEDIA_PATH` | Incoming PDF and voice-note storage |
| `WHATSAPP_AUTH_PATH` | Persistent WhatsApp Web session storage |

Never commit secrets. Keep them in `.env.local`, which is git-ignored.

## Architecture & assumptions

WhatsApp messages are marked seen and serialized per phone number. The agent
receives a persistent encrypted convenience profile plus resettable conversation
history, then uses Notarity tools to read the booking form, resolve products,
fetch slots, price the normalized payload, and submit multipart requests in
debug mode. PDFs are treated as untrusted input, and final appointment
submission always requires explicit confirmation.

The Notarity booking form remains the source of truth. API-bound participant and
product payloads are normalized at the client boundary so model-generated helper
fields cannot violate the strict staging DTO.

## Troubleshooting

- `Cannot GET /appointment-requests/time-slots` → the correct endpoint is
  `/appointment-requests/timeslots`.
- Timeslot request returns `400` → use `_timeslotLabel`, ISO `startDate` and
  `endDate`, with a range of no more than eight days.
- WhatsApp asks to pair again → confirm `WHATSAPP_AUTH_PATH` is persistent.
- Voice reply falls back to text → inspect the ElevenLabs and WhatsApp media
  error logs and verify the configured API key and voice ID.
- Pricing returns DTO validation errors → restart the service to load the
  payload normalizer, then reset the chat and retry.

---

## Team

- Yahia Elramal
- Yassin Amin
- Ahmed Shendy
- Ahmed Sayed

## Submission

- Track: **Notarity** · Case partner: **Notarity**
- Submitted to the START Hack Vienna '26 GitHub organisation.

## License

Released under the MIT License — see [`LICENSE`](LICENSE).
