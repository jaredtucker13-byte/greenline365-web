#!/usr/bin/env node
// ============================================================
// run_migrations.js — Execute Supabase migration SQL files
// ============================================================
// Reads the 00001–00004 migration files and executes each one
// against the Supabase database via the pg-meta SQL endpoint.
//
// Usage:
//   SUPABASE_SERVICE_ROLE_KEY="ey..." node run_migrations.js
// ============================================================

const fs = require("fs");
const path = require("path");

const PROJECT_REF = "rawlqwjdfzicjepzmcng";
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const MIGRATIONS_DIR = path.join(__dirname, "supabase", "migrations");

const MIGRATION_FILES = [
  "00001_consolidated_rls.sql",
  "00002_full_rls_coverage.sql",
  "00003_performance_indexes.sql",
  "00004_cleanup_test_data.sql",
];

// ── helpers ──────────────────────────────────────────────────

function getServiceRoleKey() {
  // 1. Explicit env var
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
  // 2. Try reading .env.local
  const envPath = path.join(__dirname, ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const match = envContent.match(
      /^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m
    );
    if (match) return match[1].trim().replace(/^["']|["']$/g, "");
  }
  return null;
}

function readMigration(filename) {
  const filepath = path.join(MIGRATIONS_DIR, filename);
  if (!fs.existsSync(filepath)) return null;
  return fs.readFileSync(filepath, "utf8");
}

async function executeSql(sql, serviceRoleKey) {
  const body = JSON.stringify({ query: sql });
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    "X-Connection-Encrypted": "true",
  };

  // Try pg-meta query endpoint (used by Supabase Studio SQL editor)
  const res = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: "POST",
    headers,
    body,
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  return { status: res.status, ok: res.ok, body: json, raw: text };
}

// ── main ─────────────────────────────────────────────────────

async function main() {
  console.log("============================================");
  console.log("Supabase Migration Runner (Node.js)");
  console.log(`Project : ${PROJECT_REF}`);
  console.log(`URL     : ${SUPABASE_URL}`);
  console.log(`Files   : ${MIGRATION_FILES.length}`);
  console.log("============================================\n");

  const serviceRoleKey = getServiceRoleKey();
  if (!serviceRoleKey) {
    console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY is not set.\n");
    console.error("  Option 1: export SUPABASE_SERVICE_ROLE_KEY='ey...'");
    console.error("  Option 2: add it to webapp/.env.local\n");
    console.error(
      "  Find it: Supabase Dashboard → Settings → API → service_role key"
    );
    process.exit(1);
  }
  console.log(
    `Key     : ${serviceRoleKey.slice(0, 10)}...${serviceRoleKey.slice(-6)}\n`
  );

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const file of MIGRATION_FILES) {
    const sql = readMigration(file);
    if (!sql) {
      console.log(`  SKIP  ${file} (not found)`);
      skipped++;
      continue;
    }

    const bytes = Buffer.byteLength(sql, "utf8");
    process.stdout.write(`  RUN   ${file} (${bytes} bytes) ... `);

    try {
      const result = await executeSql(sql, serviceRoleKey);

      if (result.ok) {
        console.log(`OK (${result.status})`);
        passed++;
      } else {
        console.log(`FAIL (${result.status})`);
        // Show first 500 chars of error body for debugging
        const errMsg =
          typeof result.body === "object" && result.body !== null
            ? JSON.stringify(result.body, null, 2)
            : result.raw;
        console.log(`        ${errMsg.slice(0, 500)}\n`);
        failed++;
      }
    } catch (err) {
      console.log(`ERROR`);
      console.log(`        ${err.message}\n`);
      failed++;
    }
  }

  console.log("\n============================================");
  console.log(
    `Results: ${passed} passed, ${failed} failed, ${skipped} skipped`
  );
  console.log("============================================");

  if (failed > 0) {
    console.log("\nIf the pg/query endpoint is not available, run via:");
    console.log(
      `  psql "postgresql://postgres.${PROJECT_REF}:<PASSWORD>@aws-0-us-east-1.pooler.supabase.com:6543/postgres"`
    );
    console.log("  Or paste SQL into: Supabase Dashboard → SQL Editor");
    process.exit(1);
  }
}

main();
