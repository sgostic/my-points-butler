import { createReadStream, createWriteStream } from "node:fs";
import { basename, dirname, join } from "node:path";
import readline from "node:readline";

const inputFile = process.argv[2] ?? "analytics-export/all-events.jsonl";
const outputFile =
  process.argv[3] ??
  join(dirname(inputFile), `${basename(inputFile, ".jsonl")}.csv`);

const rows = [];
const columns = new Set();

const input = createReadStream(inputFile, { encoding: "utf8" });
const rl = readline.createInterface({ input, crlfDelay: Infinity });

for await (const line of rl) {
  if (!line.trim()) continue;
  const row = JSON.parse(line);
  rows.push(row);
  for (const key of Object.keys(row)) columns.add(key);
}

const orderedColumns = [
  "source_table",
  "id",
  "event_name",
  "variant",
  "visitor_id",
  "session_id",
  "user_id",
  "properties",
  "path",
  "referrer",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "occurred_at",
  "received_at",
  "first_seen_at",
  "last_seen_at",
  "first_variant",
  "first_referrer",
  "first_utm",
  "session_count",
  "started_at",
  "last_event_at",
  "ended_at",
  "duration_ms",
  "max_scroll_pct",
  "event_count",
  "entry_path",
  "user_agent",
  "context",
  "liked",
  "disliked",
  "helps",
  "would_pay",
  "monthly_price",
  "created_at",
  "email",
  "source",
  "message",
  "amount",
  "currency",
  "status",
  "conversation_id",
  "role",
  "content",
];

const header = orderedColumns.filter((key) => columns.has(key));
for (const key of columns) {
  if (!header.includes(key)) header.push(key);
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text =
    typeof value === "string" ? value : JSON.stringify(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const output = createWriteStream(outputFile, { encoding: "utf8" });
output.write(`${header.map(csvEscape).join(",")}\n`);

for (const row of rows) {
  output.write(`${header.map((key) => csvEscape(row[key])).join(",")}\n`);
}

await new Promise((resolve, reject) => {
  output.end(() => resolve());
  output.on("error", reject);
});

console.log(`Wrote ${outputFile}`);
