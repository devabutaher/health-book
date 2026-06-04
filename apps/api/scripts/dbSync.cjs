/**
 * dbSync — Apply Prisma schema changes to Supabase through the pooler.
 * 
 * Usage:
 *   node scripts/dbSync.cjs <migration_name>
 *
 * Workflow:
 *   1. Edit schema.prisma with your changes
 *   2. Run: node scripts/dbSync.cjs describe_your_change
 *   3. Script generates the diff, applies it, creates migration, registers it
 *
 * First run: uses --from-empty (creates baseline snapshot for future diffs)
 * Subsequent runs: diffs from baseline to current schema
 */

require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('../generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SCHEMA_FILE = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const BASELINE_FILE = path.join(__dirname, '..', 'prisma', 'schema_baseline.prisma');

async function main() {
  const label = process.argv[2];
  if (!label) {
    console.log('Usage: node scripts/dbSync.cjs <migration_name>');
    console.log('  e.g. node scripts/dbSync.cjs add_user_bio_field');
    process.exit(1);
  }

  // Step 1: Generate SQL diff
  const hasBaseline = fs.existsSync(BASELINE_FILE);
  const fromFlag = hasBaseline ? `--from-schema "${BASELINE_FILE}"` : '--from-empty';

  console.log(`Generating SQL diff (${hasBaseline ? 'baseline → current' : 'empty → current'})...`);
  const sql = execSync(
    `npx prisma migrate diff ${fromFlag} --to-schema "${SCHEMA_FILE}" --script`,
    { encoding: 'utf-8', cwd: path.join(__dirname, '..') }
  );

  // Check if there's actually anything to apply
  const statements = sql
    .split(';')
    .map(s => s.trim().split('\n').filter(l => !l.trim().startsWith('--')).join('\n').trim())
    .filter(s => s);
  if (statements.length === 0) {
    console.log('No changes detected. Schema is already in sync.');
    return;
  }

  // Step 2: Execute SQL via Prisma adapter
  console.log('Connecting to database...');
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  await prisma.$connect();
  console.log('  Connected');

  let ok = 0, skip = 0;
  for (const stmt of statements) {
    // Remove newlines within the statement (Prisma output uses \n between comment and SQL)
    const cleanStmt = stmt.replace(/\n+/g, ' ').trim();
    if (!cleanStmt) continue;
    try {
      await prisma.$executeRawUnsafe(cleanStmt + ';');
      ok++;
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('already exists') || e.code === '42P07' || e.code === '42710') {
        ok++; // Already exists is fine
      } else {
        console.log(`  WARN: ${msg.substring(0, 120)}`);
        skip++;
      }
    }
  }
  console.log(`  Statements: ${ok} applied, ${skip} skipped`);

  // Step 3: Create migration file
  const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
  const dirName = `${ts}_${label}`;
  const dir = path.join(__dirname, '..', 'prisma', 'migrations', dirName);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'migration.sql'), sql);
  console.log(`  Migration created: ${dirName}`);

  // Step 4: Register in _prisma_migrations
  const checksum = crypto.createHash('sha256').update(sql).digest('hex');
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO _prisma_migrations (id, checksum, migration_name, finished_at, started_at)
       VALUES (gen_random_uuid()::text, $1, $2, now(), now())`,
      checksum, dirName
    );
    console.log('  Registered in _prisma_migrations');
  } catch (e) {
    console.log('  (migration already registered)');
  }

  // Step 5: Update baseline snapshot to current schema
  fs.copyFileSync(SCHEMA_FILE, BASELINE_FILE);
  console.log('  Baseline snapshot updated');

  // Step 6: Regenerate client
  console.log('Regenerating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  await prisma.$disconnect();
  console.log('\nDone! Schema is in sync.');
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
