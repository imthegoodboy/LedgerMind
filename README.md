# LedgerMind AI

LedgerMind AI is a verifiable finance-operations workspace for receipt capture, expense analytics, AI chat, report generation, audit review, and approval-controlled payment intents. It is built for the Terminal3 ADK challenge and treats every sensitive agent action as a signed, auditable event.

## Product

LedgerMind has four scoped finance agents:

- Receipt Agent: extracts receipt metadata and creates normalized expense rows.
- Category Agent: classifies expenses and flags unusual spend shifts.
- Report Agent: generates monthly, tax, business, JSON, CSV, and print-ready reports.
- Payment Agent: prepares high-risk payment intents and waits for human approval.

The app is not a landing-page demo. It includes working pages, server routes, persistence, receipt parsing, protected action logs, and a production-style local validation path.

## Architecture

- Frontend and backend: Next.js App Router in `frontend`.
- Server APIs: Next route handlers under `frontend/app/api`.
- Persistence: MongoDB through `frontend/lib/server/db.ts`, with memory fallback only when explicitly enabled for local smoke testing.
- AI: OpenAI Responses API for chat and image receipt extraction, with deterministic local fallback when OpenAI is unavailable.
- Evidence storage: optional Cloudinary upload for receipt files.
- Agent proofs: `frontend/lib/server/actions.ts` writes audit rows with Terminal3 proof envelopes.
- Terminal3 adapter: `frontend/lib/server/terminal3.ts` owns all SDK calls, WASM loading, live session cache, contract execution gating, and degraded-mode handling.

## Terminal3 SDK Usage

The app uses `@terminal3/t3n-sdk` in the server runtime. Implemented SDK coverage:

- `setEnvironment(testnet|production)`
- `loadWasmComponent({ wasmPath })`
- `eth_get_address(T3N_API_KEY)`
- `T3nClient.handshake()`
- `T3nClient.authenticate(createEthAuthInput(...))`
- `getUsage()` for token balance reads
- `getAuditEvents()` for recent encrypted audit reads
- `TenantClient` for tenant status and setup helpers
- `executeAndDecode()` for protected contract calls when `T3N_CONTRACT_SCRIPT` is registered

If live Terminal3 calls fail, LedgerMind marks the proof as `degraded` instead of pretending execution succeeded. If no Terminal3 contract is registered, the app records `contractExecution: not-configured` and keeps the live authenticated session evidence attached to the action.

Contract source is separated under `contracts/ledgermind-agent-contract`.

## Pages

- `/` - animated product overview.
- `/dashboard` - spend analytics, charts, Terminal3 state, and recent ledger rows.
- `/chat` - AI finance assistant with protected action logging.
- `/upload` - receipt OCR and evidence capture.
- `/reports` - report generation with JSON, CSV, and print-ready export.
- `/activity` - audit log review and approval actions.
- `/agents` - agent monitor, SDK session, SDK coverage, and protected action trigger.
- `/login` - optional workspace-code gate.

## Security Controls

- Optional workspace lock through `LEDGERMIND_WORKSPACE_CODE`.
- Signed HttpOnly workspace session cookie.
- Admin-only Terminal3 setup route through `LEDGERMIND_ADMIN_TOKEN`.
- Same-origin enforcement for mutating API routes.
- In-memory rate limits per route and IP.
- MongoDB fail-fast behavior in production unless `LEDGERMIND_ALLOW_MEMORY_FALLBACK=1` is explicitly set.
- Vercel Analytics loads only on Vercel to avoid local script noise.
- `.env.local` is ignored by git; keep API keys there or in deployment environment variables.

## Environment

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

Notes:

- `T3N_API_KEY` and `T3N_DID` must come from your Terminal3 sandbox.
- `T3N_CONTRACT_SCRIPT` is optional until the contract is published.
- `T3N_CONTRACT_VERSION` must be semver, for example `0.1.0`.
- `T3N_WASM_PATH` is optional; the app resolves the SDK WASM file from `node_modules` by default.
- Cloudinary is optional. Without `CLOUDINARY_CLOUD_NAME`, receipts still parse and store metadata.

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

Run:

```bash
cd frontend
corepack pnpm lint
corepack pnpm build
corepack pnpm audit --prod
```

Expected:

- ESLint passes.
- Next production build passes.
- Production dependency audit returns no known vulnerabilities.
- Browser smoke should confirm all main pages load, Terminal3 session is live, protected action approval works, receipt upload works, and report generation works.

## Deployment

Deploy as a single Vercel project from the `frontend` directory.

Suggested Vercel settings:

- Root directory: `frontend`
- Install command: `corepack pnpm install`
- Build command: `corepack pnpm build`
- Output: Next.js default

Set all production environment variables in Vercel before deploying. A separate Render backend is not required because the backend is implemented with Next.js API routes. Render is only needed later if you split out a long-lived worker or an external contract deployment service.

## Official Links

- Terminal3: https://www.terminal3.io/
- Terminal3 Agent Developer Kit: https://www.terminal3.io/products/agent-developer-kit
- Terminal3 ADK docs: https://docs.terminal3.io/developers/adk/overview/what-is-adk
- Terminal3 T3N docs: https://docs.terminal3.io/t3n/overview/what-is-t3n
- Terminal3 platform docs: https://docs.terminal3.io/intro/platform
- Hackathon challenge: https://dorahacks.io/hackathon/t3adkdevchallenge/detail
