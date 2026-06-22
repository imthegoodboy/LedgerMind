import "server-only";

import { MongoClient, type Db } from "mongodb";
import { sampleExpenses } from "@/lib/ledger-data";
import type { AuditLog, Expense } from "@/lib/ledger-types";

type MemoryStore = {
  expenses: Expense[];
  auditLogs: AuditLog[];
};

const globalForLedger = globalThis as typeof globalThis & {
  __ledgerMindMemory?: MemoryStore;
  __ledgerMindMongo?: Promise<MongoClient | null>;
  __ledgerMindMongoError?: Error;
};

function memoryStore(): MemoryStore {
  globalForLedger.__ledgerMindMemory ??= {
    expenses: [...sampleExpenses],
    auditLogs: [],
  };
  return globalForLedger.__ledgerMindMemory;
}

function allowMemoryFallback() {
  return process.env.LEDGERMIND_ALLOW_MEMORY_FALLBACK === "1" || process.env.NODE_ENV !== "production";
}

async function mongoClient(): Promise<MongoClient | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  globalForLedger.__ledgerMindMongo ??= new MongoClient(uri, {
    appName: "LedgerMindAI",
    serverSelectionTimeoutMS: 5000,
  })
    .connect()
    .catch((error) => {
      globalForLedger.__ledgerMindMongoError = error instanceof Error ? error : new Error("MongoDB connection failed");
      return null;
    });

  return globalForLedger.__ledgerMindMongo;
}

async function db(): Promise<Db | null> {
  const client = await mongoClient();
  if (!client && globalForLedger.__ledgerMindMongoError && !allowMemoryFallback()) {
    throw globalForLedger.__ledgerMindMongoError;
  }
  return client?.db("ledgermind_ai") ?? null;
}

export async function listExpenses(): Promise<Expense[]> {
  const database = await db();
  if (!database) return memoryStore().expenses;

  const expenses = await database
    .collection<Expense>("expenses")
    .find({}, { projection: { _id: 0 } })
    .sort({ date: -1 })
    .toArray();

  if (expenses.length === 0) {
    await database.collection<Expense>("expenses").insertMany(sampleExpenses, { ordered: false }).catch(() => undefined);
    return sampleExpenses;
  }

  return expenses;
}

export async function insertExpense(expense: Expense): Promise<Expense> {
  const database = await db();
  if (!database) {
    memoryStore().expenses = [expense, ...memoryStore().expenses.filter((item) => item.id !== expense.id)];
    return expense;
  }

  await database.collection<Expense>("expenses").updateOne({ id: expense.id }, { $set: expense }, { upsert: true });
  return expense;
}

export async function listAuditLogs(limit = 50): Promise<AuditLog[]> {
  const database = await db();
  if (!database) return memoryStore().auditLogs.slice(0, limit);

  return database
    .collection<AuditLog>("audit_logs")
    .find({}, { projection: { _id: 0 } })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
}

export async function getAuditLog(id: string): Promise<AuditLog | null> {
  const database = await db();
  if (!database) return memoryStore().auditLogs.find((log) => log.id === id) ?? null;

  return database.collection<AuditLog>("audit_logs").findOne({ id }, { projection: { _id: 0 } });
}

export async function insertAuditLog(log: AuditLog): Promise<AuditLog> {
  const database = await db();
  if (!database) {
    memoryStore().auditLogs = [log, ...memoryStore().auditLogs.filter((item) => item.id !== log.id)];
    return log;
  }

  await database.collection<AuditLog>("audit_logs").updateOne({ id: log.id }, { $set: log }, { upsert: true });
  return log;
}

export async function updateAuditLog(log: AuditLog): Promise<AuditLog> {
  const database = await db();
  if (!database) {
    memoryStore().auditLogs = [log, ...memoryStore().auditLogs.filter((item) => item.id !== log.id)];
    return log;
  }

  await database.collection<AuditLog>("audit_logs").updateOne({ id: log.id }, { $set: log }, { upsert: true });
  return log;
}
