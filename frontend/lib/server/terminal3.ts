import "server-only";

import crypto from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import type { ProtectedActionInput, Terminal3Proof, Terminal3SessionSnapshot } from "@/lib/ledger-types";
import { agentById } from "@/lib/ledger-data";

const baseSdkSteps = [
  "setEnvironment(testnet|production)",
  "loadWasmComponent({ wasmPath })",
  "eth_get_address(T3N_API_KEY)",
  "T3nClient.handshake()",
  "T3nClient.authenticate(createEthAuthInput)",
  "getUsage() token ledger read",
  "getAuditEvents() encrypted audit read",
  "TenantClient tenant/maps/contracts helpers",
  "executeAndDecode() contract invocation when T3N_CONTRACT_SCRIPT is registered",
];

type Terminal3Sdk = typeof import("@terminal3/t3n-sdk");
type Terminal3Client = InstanceType<Terminal3Sdk["T3nClient"]>;

type LiveConnection = {
  client: Terminal3Client;
  snapshot: Terminal3SessionSnapshot;
};

type ConnectionCache = {
  expiresAt: number;
  connection: LiveConnection;
};

type SnapshotCache = {
  expiresAt: number;
  snapshot: Terminal3SessionSnapshot;
};

const globalForTerminal3 = globalThis as typeof globalThis & {
  __ledgerMindT3Live?: ConnectionCache;
  __ledgerMindT3Snapshot?: SnapshotCache;
  __ledgerMindT3Sdk?: Promise<Terminal3Sdk>;
};

function importTerminal3Sdk() {
  if (!globalForTerminal3.__ledgerMindT3Sdk) {
    // Keep the generated SDK/WASM runtime out of the Next server bundle.
    const runtimeImport = new Function("specifier", "return import(specifier)") as (
      specifier: string,
    ) => Promise<Terminal3Sdk>;
    globalForTerminal3.__ledgerMindT3Sdk = runtimeImport("@terminal3/t3n-sdk");
  }

  return globalForTerminal3.__ledgerMindT3Sdk;
}

function environment() {
  return process.env.T3N_ENVIRONMENT === "production" ? "production" : "testnet";
}

function configuredDid() {
  return process.env.T3N_DID?.trim() || null;
}

function liveSdkEnabled() {
  return process.env.T3N_DISABLE_LIVE !== "1";
}

function terminal3ContractConfig() {
  const scriptName = process.env.T3N_CONTRACT_SCRIPT?.trim();
  if (!scriptName) return { configured: false as const };

  const scriptVersion = process.env.T3N_CONTRACT_VERSION?.trim() || "0.1.0";
  const validSemver = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(scriptVersion);
  if (!validSemver) {
    return {
      configured: true as const,
      error: "T3N_CONTRACT_VERSION must be a semver string such as 0.1.0.",
    };
  }

  return { configured: true as const, scriptName, scriptVersion };
}

function terminal3WasmPath() {
  const configuredPath = process.env.T3N_WASM_PATH?.trim();
  const candidates = [
    configuredPath,
    path.join(process.cwd(), "node_modules", "@terminal3", "t3n-sdk", "dist", "wasm", "generated", "session.core.wasm"),
    path.join(
      process.cwd(),
      "frontend",
      "node_modules",
      "@terminal3",
      "t3n-sdk",
      "dist",
      "wasm",
      "generated",
      "session.core.wasm",
    ),
  ].filter((candidate): candidate is string => Boolean(candidate));

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

function timeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

function digestPayload(payload: unknown) {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function fallbackSignature(digest: string) {
  const secret = process.env.T3N_API_KEY || process.env.NEXTAUTH_SECRET || "ledgermind-local-proof";
  return crypto.createHmac("sha256", secret).update(digest).digest("hex");
}

function canonicalScriptName(did: string | null) {
  const configuredScript = process.env.T3N_CONTRACT_SCRIPT?.trim();
  if (configuredScript) return configuredScript;
  if (!did) return "z:local:ledgermind-expense-contracts";

  const didTail = did.replace(/^did:t3n:/, "").replace(/[^a-zA-Z0-9_-]/g, "");
  return `z:${didTail || "local"}:ledgermind-expense-contracts`;
}

async function createClient() {
  const key = process.env.T3N_API_KEY;
  if (!key) throw new Error("T3N_API_KEY is not configured");

  const sdk = await importTerminal3Sdk();
  sdk.setEnvironment(environment());
  const wasmComponent = await sdk.loadWasmComponent({ wasmPath: terminal3WasmPath() });
  const address = sdk.eth_get_address(key);
  const client = new sdk.T3nClient({
    wasmComponent,
    handlers: {
      EthSign: sdk.metamask_sign(address, undefined, key),
    },
  });

  return { client, address, sdk };
}

async function openLiveConnection(force = false): Promise<LiveConnection> {
  const cached = globalForTerminal3.__ledgerMindT3Live;
  if (!force && cached && cached.expiresAt > Date.now()) return cached.connection;

  const key = process.env.T3N_API_KEY;
  if (!key) throw new Error("T3N_API_KEY is missing");
  if (!liveSdkEnabled()) throw new Error("Live Terminal3 SDK calls are disabled by T3N_DISABLE_LIVE=1.");

  const env = environment();
  const { client, address, sdk } = await timeout(createClient(), 12_000, "Terminal3 client creation");
  const handshake = await timeout(client.handshake(), 12_000, "Terminal3 handshake");
  const did = await timeout(client.authenticate(sdk.createEthAuthInput(address)), 12_000, "Terminal3 authentication");
  const nodeUrl = sdk.getNodeUrl();

  let balance: string | null = null;
  let tenantStatus: string | null = null;
  let auditEventCount: number | undefined;

  try {
    const usage = await timeout(client.getUsage({ limit: 5 }), 8_000, "Terminal3 usage read");
    balance = usage?.balance ? sdk.formatTokens(usage.balance.available) : null;
  } catch {
    balance = null;
  }

  try {
    const events = (await timeout(client.getAuditEvents({ limit: 5 }), 8_000, "Terminal3 audit read")) as {
      batches?: Array<{ events?: unknown[] }>;
      events?: unknown[];
    };
    auditEventCount = events.events?.length ?? events.batches?.reduce((sum, batch) => sum + (batch.events?.length ?? 0), 0) ?? 0;
  } catch {
    auditEventCount = undefined;
  }

  try {
    const tenant = new sdk.TenantClient({
      t3n: client,
      baseUrl: nodeUrl,
      tenantDid: configuredDid() ?? did.value,
    });
    const tenantInfo = (await timeout(tenant.tenant.me(), 8_000, "Terminal3 tenant read")) as { status?: string } | null;
    tenantStatus = tenantInfo?.status ?? "reachable";
  } catch {
    tenantStatus = "not admitted or unavailable";
  }

  const snapshot: Terminal3SessionSnapshot = {
    configured: true,
    mode: "live",
    environment: env,
    did: did.value,
    configuredDid: configuredDid(),
    address: sdk.maskKeyMaterial(address),
    nodeUrl,
    sessionId: handshake.sessionId.value,
    expiresAt: handshake.expiry > 0 ? new Date(handshake.expiry).toISOString() : null,
    balance,
    tenantStatus,
    sdkCoverage: baseSdkSteps,
  };

  const connection = { client, snapshot };
  globalForTerminal3.__ledgerMindT3Live = {
    expiresAt: Date.now() + 60_000,
    connection,
  };

  if (auditEventCount !== undefined) {
    snapshot.sdkCoverage = [...baseSdkSteps, `getAuditEvents() returned ${auditEventCount} recent events`];
  }

  return connection;
}

function localSnapshot(error: string): Terminal3SessionSnapshot {
  const key = process.env.T3N_API_KEY;
  return {
    configured: Boolean(key),
    mode: key ? "degraded" : "local",
    environment: environment(),
    did: configuredDid(),
    configuredDid: configuredDid(),
    address: null,
    nodeUrl: null,
    sessionId: null,
    expiresAt: null,
    balance: null,
    tenantStatus: key ? "live SDK unavailable" : null,
    sdkCoverage: baseSdkSteps,
    error,
  };
}

export async function getTerminal3SessionSnapshot(force = false): Promise<Terminal3SessionSnapshot> {
  const cached = globalForTerminal3.__ledgerMindT3Snapshot;
  if (!force && cached && cached.expiresAt > Date.now()) return cached.snapshot;

  try {
    const connection = await openLiveConnection(force);
    globalForTerminal3.__ledgerMindT3Snapshot = {
      expiresAt: Date.now() + 60_000,
      snapshot: connection.snapshot,
    };
    return connection.snapshot;
  } catch (error) {
    const snapshot = localSnapshot(error instanceof Error ? error.message : "Terminal3 SDK session failed");
    globalForTerminal3.__ledgerMindT3Snapshot = {
      expiresAt: Date.now() + 20_000,
      snapshot,
    };
    return snapshot;
  }
}

async function executeProtectedContract(connection: LiveConnection, input: ProtectedActionInput, digest: string) {
  const agent = agentById(input.agentId);
  const contract = terminal3ContractConfig();
  if (!contract.configured) throw new Error("T3N_CONTRACT_SCRIPT is not configured.");
  if (contract.error) throw new Error(contract.error);

  return timeout(
    connection.client.executeAndDecode({
      script_name: contract.scriptName,
      script_version: contract.scriptVersion,
      function_name: agent.contractFunction,
      input: {
        agent_id: input.agentId,
        action: input.action,
        target: input.target,
        risk: input.risk,
        requires_approval: Boolean(input.requiresApproval),
        digest,
        payload: input.payload ?? {},
      },
    }),
    12_000,
    `Terminal3 contract ${agent.contractFunction}`,
  );
}

export async function createTerminal3Proof(input: ProtectedActionInput): Promise<Terminal3Proof> {
  const agent = agentById(input.agentId);
  const digest = digestPayload({
    ...input,
    agentTerminalName: agent.terminalName,
    createdAt: new Date().toISOString().slice(0, 16),
  });

  let connection: LiveConnection | null = null;
  let snapshot = await getTerminal3SessionSnapshot();

  if (snapshot.mode === "live") {
    try {
      connection = await openLiveConnection();
      snapshot = connection.snapshot;
    } catch {
      connection = null;
    }
  }

  const did = snapshot.did ?? snapshot.configuredDid;
  let contractExecution: Terminal3Proof["contractExecution"] = connection ? "failed" : "skipped";
  let contractResult: unknown;
  let contractError: string | undefined;
  let signatureKind: Terminal3Proof["signatureKind"] = "local-hmac-fallback";
  let signature = fallbackSignature(digest);

  if (connection) {
    const contract = terminal3ContractConfig();
    if (!contract.configured) {
      contractExecution = "not-configured";
    } else if (contract.error) {
      contractExecution = "failed";
      contractError = contract.error;
    } else {
      try {
        contractResult = await executeProtectedContract(connection, input, digest);
        contractExecution = "executed";
        signatureKind = "terminal3-contract";
        signature = digestPayload({ digest, contractResult, sessionId: snapshot.sessionId });
      } catch (error) {
        contractExecution = "failed";
        contractError = error instanceof Error ? error.message : "Terminal3 contract execution failed";
      }
    }
  }

  return {
    mode: snapshot.mode,
    environment: snapshot.environment,
    did,
    agentDid: `${did ?? "did:t3n:local"}#${input.agentId}`,
    nodeUrl: snapshot.nodeUrl,
    sessionId: snapshot.sessionId,
    scriptName: canonicalScriptName(did),
    functionName: agent.contractFunction,
    digest,
    signature,
    signatureKind,
    contractExecution,
    contractResult,
    contractError,
    sdkSteps: snapshot.sdkCoverage,
    error: snapshot.error,
  };
}

export async function prepareTenantMap(contractId: number) {
  const connection = await openLiveConnection(true);
  const sdk = await importTerminal3Sdk();
  const did = connection.snapshot.did ?? configuredDid();
  const tenant = new sdk.TenantClient({
    t3n: connection.client,
    baseUrl: connection.snapshot.nodeUrl ?? sdk.getNodeUrl(),
    tenantDid: did ?? undefined,
  });

  return tenant.maps.create({
    tail: "secrets",
    visibility: "private",
    writers: { only: [contractId] },
    readers: { only: [contractId] },
  });
}
