import "server-only";

import crypto from "node:crypto";
import OpenAI from "openai";
import type { Expense } from "@/lib/ledger-types";

type ParsedReceipt = Pick<Expense, "merchant" | "amount" | "currency" | "date" | "category" | "taxDeductible" | "confidence" | "notes">;

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function inferCategory(text: string) {
  const lower = text.toLowerCase();
  if (/(aws|vercel|github|cloud|canva|software|saas)/.test(lower)) return "Software";
  if (/(uber|flight|hotel|train|travel|air)/.test(lower)) return "Travel";
  if (/(zomato|swiggy|food|cafe|restaurant)/.test(lower)) return "Food";
  if (/(airtel|internet|electric|utility)/.test(lower)) return "Utilities";
  return "Shopping";
}

function inferAmount(text: string, size: number) {
  const match = text.match(/(?:usd|inr|rs|\$|₹)?\s*(\d{2,5})(?:\.\d{1,2})?/i);
  if (match) return Number(match[1]);
  return Math.max(18, Math.min(840, Math.round(size / 1024)));
}

function fallbackParse(file: File, note: string): ParsedReceipt {
  const text = `${file.name} ${note}`;
  return {
    merchant: titleCase(file.name) || "Uploaded Receipt",
    amount: inferAmount(text, file.size),
    currency: /₹|inr|rs/i.test(text) ? "INR" : "USD",
    date: new Date().toISOString().slice(0, 10),
    category: inferCategory(text),
    taxDeductible: /(aws|vercel|github|canva|uber|internet|airtel|business)/i.test(text),
    confidence: 0.72,
    notes: note || `Metadata fallback from ${file.name}`,
  };
}

function coerceParsedReceipt(value: unknown, fallback: ParsedReceipt): ParsedReceipt {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    merchant: typeof record.merchant === "string" && record.merchant.trim() ? record.merchant.trim() : fallback.merchant,
    amount: typeof record.amount === "number" && record.amount > 0 ? record.amount : fallback.amount,
    currency: record.currency === "INR" ? "INR" : "USD",
    date: typeof record.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(record.date) ? record.date : fallback.date,
    category: typeof record.category === "string" && record.category.trim() ? record.category.trim() : fallback.category,
    taxDeductible: typeof record.taxDeductible === "boolean" ? record.taxDeductible : fallback.taxDeductible,
    confidence: typeof record.confidence === "number" ? Math.max(0.1, Math.min(0.99, record.confidence)) : fallback.confidence,
    notes: typeof record.notes === "string" ? record.notes : fallback.notes,
  };
}

function extractJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export async function parseReceipt(file: File, note: string): Promise<ParsedReceipt> {
  const fallback = fallbackParse(file, note);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !file.type.startsWith("image/")) return fallback;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const imageUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                "Extract one receipt or invoice into strict JSON only.",
                "Fields: merchant, amount, currency (USD or INR), date (YYYY-MM-DD), category, taxDeductible, confidence, notes.",
                `User context: ${note || "none"}`,
              ].join(" "),
            },
            { type: "input_image", image_url: imageUrl, detail: "high" },
          ],
        },
      ],
      max_output_tokens: 500,
    });
    return coerceParsedReceipt(extractJson(response.output_text), fallback);
  } catch (error) {
    console.error("Receipt OCR failed", error);
    return fallback;
  }
}

function cloudinarySignature(params: Record<string, string>) {
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!secret) return null;
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(`${payload}${secret}`).digest("hex");
}

export async function uploadReceiptEvidence(file: File) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  if (!cloudName || !apiKey || !process.env.CLOUDINARY_API_SECRET) return null;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params = { folder: "ledgermind-receipts", timestamp };
  const signature = cloudinarySignature(params);
  if (!signature) return null;

  const formData = new FormData();
  formData.set("file", file);
  formData.set("api_key", apiKey);
  formData.set("timestamp", timestamp);
  formData.set("folder", params.folder);
  formData.set("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) throw new Error(`Cloudinary upload failed with ${response.status}`);
  const json = (await response.json()) as { secure_url?: string };
  return json.secure_url ?? null;
}
