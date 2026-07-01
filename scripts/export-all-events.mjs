import { createClient } from "@supabase/supabase-js";
import { createWriteStream, mkdirSync } from "node:fs";
import { join } from "node:path";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY or STORAGE_SUPABASE_SERVICE_ROLE_KEY",
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const START_DATE = "2026-06-15T00:00:00.000Z";
const MAX_LINES_PER_FILE = 1000;
const cliArgs = process.argv.slice(2);
const variantFlag = cliArgs.find((arg) => /^--[abcd]$/i.test(arg));
const selectedVariant = variantFlag ? variantFlag.slice(2).toLowerCase() : null;
const outDir = cliArgs.find((arg) => !arg.startsWith("--")) ?? "analytics-export";

mkdirSync(outDir, { recursive: true });

let fileIndex = 1;
let lineCount = 0;
let currentFile = "";
let stream = null;

function filePathForIndex(index) {
  return join(outDir, `all-events-${String(index).padStart(4, "0")}.jsonl`);
}

function openNextFile() {
  currentFile = filePathForIndex(fileIndex);
  stream = createWriteStream(currentFile, { encoding: "utf8" });
  lineCount = 0;
  fileIndex += 1;
}

async function closeCurrentFile() {
  if (!stream) return;
  const active = stream;
  stream = null;
  await new Promise((resolve, reject) => {
    active.end(() => resolve());
    active.on("error", reject);
  });
}

async function ensureWritableStream() {
  if (!stream) {
    openNextFile();
    return;
  }

  if (lineCount >= MAX_LINES_PER_FILE) {
    await closeCurrentFile();
    openNextFile();
  }
}

async function writeRow(table, row) {
  const rowVariant =
    table === "visitors"
      ? row.first_variant
      : row.variant ?? row.properties?.variant ?? null;

  if (selectedVariant && rowVariant !== selectedVariant) {
    return;
  }

  await ensureWritableStream();

  if (!stream) {
    throw new Error("Output stream is not open.");
  }

  stream.write(
    JSON.stringify({
      source_table: table,
      ...row,
    }) + "\n",
  );
  lineCount += 1;
}

async function exportTable(table, orderBy, pageSize = 1000) {
  let from = 0;

  while (true) {
    let query = supabase
      .from(table)
      .select("*")
      .gte(orderBy[0], START_DATE)
      .range(from, from + pageSize - 1);

    for (const col of orderBy) {
      query = query.order(col, { ascending: true, nullsFirst: false });
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const row of data) {
      await writeRow(table, row);
    }

    from += data.length;
    if (data.length < pageSize) break;
  }
}

async function main() {
  openNextFile();

  await exportTable("events", ["occurred_at", "id"]);
  await exportTable("visitors", ["first_seen_at", "visitor_id"]);
  await exportTable("sessions", ["started_at", "session_id"]);
  await exportTable("feedback_submissions", ["created_at", "id"]);
  await exportTable("email_subscriptions", ["created_at", "id"]);
  await exportTable("contact_messages", ["created_at", "id"]);
  await exportTable("donations", ["created_at", "id"]);
  await exportTable("chat_messages", ["created_at", "id"]);

  await closeCurrentFile();

  const suffix = selectedVariant ? ` for variant ${selectedVariant.toUpperCase()}` : "";
  console.log(`Wrote ${fileIndex - 1} file(s) to ${outDir}${suffix}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
