# LedgerMind AI

LedgerMind AI is a trusted AI finance workspace for expenses, receipts, reports, approvals, and payment-intent governance. It is built for the Terminal3 ADK challenge: every sensitive agent action creates an auditable proof envelope with agent identity, action digest, Terminal3 session state, contract function, and approval status.

## What The App Does

- Scans receipt images with AI OCR and stores normalized expense rows.
- Tracks spend, deductible expenses, category mix, and daily trends.
- Answers finance questions through an OpenAI-backed LedgerMind assistant.
- Generates monthly, tax, and business reports with JSON, CSV, and PDF-ready export.
- Separates four finance agents: Receipt Agent, Category Agent, Report Agent, and Payment Agent.
- Keeps high-risk payment intents in `pending_approval` until a workspace user approves them.
- Records every protected action in an audit trail.

## Terminal3 Integration

The server adapter uses `@terminal3/t3n-sdk` from `frontend/lib/server/terminal3.ts`.

Implemented SDK paths:

- `setEnvironment(testnet|production)`
- `loadWasmComponent({ wasmPath })`
- `eth_get_address(T3N_API_KEY)`
- `T3nClient.handshake()`
- `T3nClient.authenticate(createEthAuthInput(...))`
- `getUsage()` for token balance/usage reads
- `getAuditEvents()` for encrypted audit reads
- `TenantClient` for tenant map helpers
- `executeAndDecode()` for tenant contract execution when `T3N_CONTRACT_SCRIPT` is registered

If live Terminal3 calls fail, the app marks the proof as `degraded` instead of pretending it executed. If a tenant contract is registered, protected actions can execute through Terminal3 using:

- `T3N_CONTRACT_SCRIPT`
- `T3N_CONTRACT_VERSION`

Contract source lives separately in `contracts/ledgermind-agent-contract`.

## Main Pages

- `/` - animated product landing page.
- `/dashboard` - spend analytics, Terminal3 session state, approval counts.
- `/chat` - AI finance assistant with protected audit rows.
- `/upload` - receipt OCR/upload flow.
- `/reports` - report generation and exports.
- `/activity` - audit log and approval review.
- `/agents` - agent monitor, SDK status, protected action trigger.
- `/login` - optional workspace-code gate.

## Security And Production Controls

- Optional workspace gate with `LEDGERMIND_WORKSPACE_CODE`.
- Signed HttpOnly workspace session cookie.
- Admin-only Terminal3 setup route protected by `LEDGERMIND_ADMIN_TOKEN`.
- Same-origin checks for mutating API requests.
- Per-route in-memory rate limiting.
- MongoDB failures fail fast in production by default.
- `LEDGERMIND_ALLOW_MEMORY_FALLBACK=1` is available only for local/sandbox smoke testing.
- Vercel Analytics only loads on Vercel, avoiding local 404 noise.

## Environment Variables

Create `frontend/.env.local` for local development:

```bash
OPENAI_API_KEY=
T3N_API_KEY=
T3N_DID=
T3N_ENVIRONMENT=testnet
T3N_CONTRACT_SCRIPT=
T3N_CONTRACT_VERSION=0.1.0
T3N_DISABLE_LIVE=0
T3N_WASM_PATH=
MONGODB_URI=
LEDGERMIND_ALLOW_MEMORY_FALLBACK=0
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
LEDGERMIND_WORKSPACE_CODE=
LEDGERMIND_ADMIN_TOKEN=
LEDGERMIND_SESSION_SECRET=
```

Cloudinary upload is optional. If `CLOUDINARY_CLOUD_NAME` is not set, receipts still parse and store metadata, but file evidence is not uploaded.

## Local Development

```bash
cd frontend
corepack pnpm install
corepack pnpm dev
```

Production-style local run:

```bash
cd frontend
corepack pnpm build
corepack pnpm start
```

## Verification

Current checks:

```bash
cd frontend
corepack pnpm lint
corepack pnpm build
corepack pnpm audit --prod
```

Expected result:

- Lint passes.
- Next production build passes.
- `pnpm audit --prod` returns no known vulnerabilities.

## Deployment

The app deploys as a single Vercel project from the `frontend` directory because the backend is implemented with Next.js API routes.

Suggested Vercel settings:

- Root directory: `frontend`
- Install command: `corepack pnpm install`
- Build command: `corepack pnpm build`
- Output: Next.js default

Set production env vars in Vercel before deploying. A separate Render backend is not required unless the Terminal3 contract runner or long-lived worker is split out later.
