#!/usr/bin/env node
// ============================================================
// Smart Migration Runner
// ============================================================
// Reads database/migrations/, checks _migrations table for what's
// already applied, and only runs what's new. Logs everything.
//
// Usage:
//   node scripts/migrate.js                    # Run pending migrations
//   node scripts/migrate.js --status           # Show what's applied vs pending
//   node scripts/migrate.js --file 026_blast   # Run a specific migration
//   node scripts/migrate.js --force 026_blast  # Re-run even if already applied
//
// Env: reads from .env.local or SUPABASE_SERVICE_ROLE_KEY env var
// ============================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROJECT_REF = 'rawlqwjdfzicjepzmcng';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const MIGRATIONS_DIR = path.join(__dirname, '..', 'database', 'migrations');

// ── Helpers ──────────────────────────────────────────────────

function getServiceRoleKey() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m);
    if (match) return match[1].trim().replace(/^["']|["']$/g, '');
  }
  return null;
}

function md5(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

async function executeSql(sql, serviceRoleKey) {
  const res = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      'X-Connection-Encrypted': 'true',
    },
    body: JSON.stringify({ query: sql }),
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }
  return { status: res.status, ok: res.ok, body: json, raw: text };
}

function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`ERROR: Migration directory not found: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => /^\d{3}_.*\.sql$/.test(f)) // Only numbered migrations: 001_xxx.sql
    .sort();
}

// ── Ensure _migrations table exists ─────────────────────────

async function ensureMigrationsTable(key) {
  const sql = `
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      checksum TEXT NOT NULL,
      source_dir TEXT NOT NULL DEFAULT 'database/migrations',
      applied_at TIMESTAMPTZ DEFAULT NOW(),
      applied_by TEXT DEFAULT 'system',
      duration_ms INTEGER,
      success BOOLEAN DEFAULT true,
      error_message TEXT,
      rolled_back_at TIMESTAMPTZ
    );
  `;
  await executeSql(sql, key);
}

// ── Get applied migrations ──────────────────────────────────

async function getAppliedMigrations(key) {
  const result = await executeSql(
    `SELECT filename, checksum, applied_at, success FROM _migrations WHERE success = true AND rolled_back_at IS NULL ORDER BY filename`,
    key
  );

  if (!result.ok || !result.body) return [];

  // pg/query returns array of result sets
  const rows = Array.isArray(result.body) ? result.body[0] : result.body;
  if (!rows || !Array.isArray(rows)) return [];
  return rows;
}

// ── Run a single migration ──────────────────────────────────

async function runMigration(filename, sql, checksum, key) {
  const startTime = Date.now();

  try {
    const result = await executeSql(sql, key);
    const durationMs = Date.now() - startTime;

    if (result.ok) {
      // Record success
      await executeSql(`
        INSERT INTO _migrations (filename, checksum, source_dir, duration_ms, success, applied_by)
        VALUES ('${filename}', '${checksum}', 'database/migrations', ${durationMs}, true, 'migrate.js')
        ON CONFLICT (filename) DO UPDATE SET
          checksum = EXCLUDED.checksum,
          applied_at = NOW(),
          duration_ms = EXCLUDED.duration_ms,
          success = true,
          error_message = NULL,
          rolled_back_at = NULL
      `, key);

      return { success: true, durationMs };
    } else {
      const errorMsg = typeof result.body === 'object' ? JSON.stringify(result.body) : result.raw;
      const safeError = errorMsg.replace(/'/g, "''").slice(0, 1000);

      await executeSql(`
        INSERT INTO _migrations (filename, checksum, source_dir, duration_ms, success, error_message, applied_by)
        VALUES ('${filename}', '${checksum}', 'database/migrations', ${durationMs}, false, '${safeError}', 'migrate.js')
        ON CONFLICT (filename) DO UPDATE SET
          applied_at = NOW(),
          duration_ms = EXCLUDED.duration_ms,
          success = false,
          error_message = EXCLUDED.error_message
      `, key);

      return { success: false, error: errorMsg.slice(0, 500), durationMs };
    }
  } catch (err) {
    const durationMs = Date.now() - startTime;
    return { success: false, error: err.message, durationMs };
  }
}

// ── Commands ────────────────────────────────────────────────

async function showStatus(key) {
  const files = getMigrationFiles();
  const applied = await getAppliedMigrations(key);
  const appliedMap = new Map(applied.map(r => [r.filename, r]));

  console.log('\n  Migration Status');
  console.log('  ─────────────────────────────────────────────────');

  let pending = 0;
  for (const file of files) {
    const record = appliedMap.get(file);
    if (record) {
      const date = new Date(record.applied_at).toLocaleDateString();
      console.log(`  [applied]  ${file}  (${date})`);
    } else {
      console.log(`  [PENDING]  ${file}`);
      pending++;
    }
  }

  console.log('  ─────────────────────────────────────────────────');
  console.log(`  Total: ${files.length} | Applied: ${files.length - pending} | Pending: ${pending}\n`);

  return pending;
}

async function runPending(key) {
  const files = getMigrationFiles();
  const applied = await getAppliedMigrations(key);
  const appliedSet = new Set(applied.map(r => r.filename));

  const pending = files.filter(f => !appliedSet.has(f));

  if (pending.length === 0) {
    console.log('\n  All migrations are up to date.\n');
    return { passed: 0, failed: 0 };
  }

  console.log(`\n  Running ${pending.length} pending migration(s)...\n`);

  let passed = 0;
  let failed = 0;

  for (const file of pending) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    const checksum = md5(sql);

    process.stdout.write(`  RUN  ${file} ... `);
    const result = await runMigration(file, sql, checksum, key);

    if (result.success) {
      console.log(`OK (${result.durationMs}ms)`);
      passed++;
    } else {
      console.log(`FAIL (${result.durationMs}ms)`);
      console.log(`       ${result.error}\n`);
      failed++;
      // Stop on first failure — don't run subsequent migrations
      console.log('  Stopping: fix the failed migration before continuing.\n');
      break;
    }
  }

  console.log(`\n  Results: ${passed} passed, ${failed} failed, ${pending.length - passed - failed} skipped\n`);
  return { passed, failed };
}

async function runSpecific(key, pattern, force) {
  const files = getMigrationFiles();
  const match = files.find(f => f.includes(pattern));

  if (!match) {
    console.error(`  No migration file matching "${pattern}"`);
    console.error(`  Available: ${files.join(', ')}`);
    process.exit(1);
  }

  if (!force) {
    const applied = await getAppliedMigrations(key);
    const alreadyApplied = applied.find(r => r.filename === match);
    if (alreadyApplied) {
      console.log(`\n  ${match} was already applied on ${new Date(alreadyApplied.applied_at).toLocaleDateString()}`);
      console.log(`  Use --force to re-run it.\n`);
      return;
    }
  }

  const filePath = path.join(MIGRATIONS_DIR, match);
  const sql = fs.readFileSync(filePath, 'utf8');
  const checksum = md5(sql);

  process.stdout.write(`\n  RUN  ${match} ${force ? '(forced) ' : ''}... `);
  const result = await runMigration(match, sql, checksum, key);

  if (result.success) {
    console.log(`OK (${result.durationMs}ms)\n`);
  } else {
    console.log(`FAIL (${result.durationMs}ms)`);
    console.log(`       ${result.error}\n`);
    process.exit(1);
  }
}

// ── Main ────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const isStatus = args.includes('--status');
  const fileArg = args.find((_, i) => args[i - 1] === '--file');
  const forceArg = args.find((_, i) => args[i - 1] === '--force');
  const isForce = args.includes('--force');

  console.log('============================================');
  console.log('GL365 Smart Migration Runner');
  console.log(`Project : ${PROJECT_REF}`);
  console.log(`Dir     : database/migrations/`);
  console.log('============================================');

  const key = getServiceRoleKey();
  if (!key) {
    console.error('\nERROR: SUPABASE_SERVICE_ROLE_KEY not found.');
    console.error('  Set it in .env.local or as an environment variable.\n');
    process.exit(1);
  }

  // Ensure tracking table exists
  await ensureMigrationsTable(key);

  if (isStatus) {
    await showStatus(key);
  } else if (fileArg || forceArg) {
    await runSpecific(key, fileArg || forceArg, isForce);
  } else {
    const pending = await showStatus(key);
    if (pending > 0) {
      await runPending(key);
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
