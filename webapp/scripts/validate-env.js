#!/usr/bin/env node
// ============================================================
// Environment Validator — Pre-Deploy Safety Net
// ============================================================
// Runs before every build. Checks that required env vars are set.
// Blocks deploy if critical vars are missing.
//
// Usage:
//   node scripts/validate-env.js          # Validate all
//   node scripts/validate-env.js --strict # Fail on warnings too
//
// Add to package.json scripts:
//   "prebuild": "node scripts/validate-env.js"
// ============================================================

const ENV_SCHEMA = {
  // ── CRITICAL: Build will fail without these ──
  critical: [
    {
      key: 'NEXT_PUBLIC_SUPABASE_URL',
      description: 'Supabase project URL',
      pattern: /^https:\/\/.*\.supabase\.co$/,
      hint: 'Should look like: https://xxxx.supabase.co',
    },
    {
      key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      description: 'Supabase anonymous/public key',
      pattern: /^eyJ/,
      hint: 'Should start with "eyJ" (JWT)',
    },
    {
      key: 'SUPABASE_SERVICE_ROLE_KEY',
      description: 'Supabase service role key (server-only)',
      pattern: /^eyJ/,
      hint: 'Should start with "eyJ" (JWT). Never expose to client.',
    },
  ],

  // ── IMPORTANT: Features won't work without these ──
  important: [
    {
      key: 'OPENROUTER_API_KEY',
      description: 'OpenRouter API key (AI features: Content Forge, Local Pulse, Brain)',
      features: ['content_forge', 'local_pulse', 'brain_system'],
    },
    {
      key: 'NEXT_PUBLIC_SITE_URL',
      description: 'Site URL for callbacks and redirects',
      pattern: /^https?:\/\//,
      hint: 'e.g. https://greenline365.com',
    },
    {
      key: 'CRON_SECRET',
      description: 'Protects cron endpoints from unauthorized access',
      features: ['cron_jobs'],
    },
  ],

  // ── OPTIONAL: Specific integrations ──
  optional: [
    {
      key: 'SENDGRID_API_KEY',
      description: 'SendGrid for transactional emails',
      features: ['email_campaigns', 'blast_deals'],
    },
    {
      key: 'SENDGRID_FROM_EMAIL',
      description: 'Sender email for SendGrid',
      features: ['email_campaigns', 'blast_deals'],
    },
    {
      key: 'STRIPE_SECRET_KEY',
      description: 'Stripe for payment processing',
      pattern: /^sk_/,
      features: ['billing'],
    },
    {
      key: 'TWILIO_ACCOUNT_SID',
      description: 'Twilio for SMS',
      features: ['sms_campaigns'],
    },
    {
      key: 'TWILIO_SMS_NUMBER',
      description: 'Twilio sender phone number',
      features: ['sms_campaigns'],
    },
    {
      key: 'RETELL_API_KEY',
      description: 'Retell for voice AI agents',
      features: ['voice_ai'],
    },
    {
      key: 'CALCOM_API_KEY',
      description: 'Cal.com for booking/scheduling',
      features: ['booking_system'],
    },
    {
      key: 'GMAIL_USER',
      description: 'Gmail SMTP fallback',
      features: ['email_fallback'],
    },
    {
      key: 'GMAIL_APP_PASSWORD',
      description: 'Gmail app password for SMTP',
      features: ['email_fallback'],
    },
    {
      key: 'OPENWEATHER_API_KEY',
      description: 'Weather data for trend context',
      features: ['local_pulse'],
    },
    {
      key: 'KIE_API_KEY',
      description: 'Kie.ai for image generation',
      features: ['creative_studio'],
    },
  ],
};

// ── Validation ──────────────────────────────────────────────

function validate() {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || 'development';

  console.log('============================================');
  console.log('GL365 Environment Validator');
  console.log(`Environment: ${env}`);
  console.log('============================================\n');

  let errors = 0;
  let warnings = 0;
  let passed = 0;

  // Check critical vars
  console.log('  CRITICAL (build will fail without these):');
  for (const v of ENV_SCHEMA.critical) {
    const value = process.env[v.key];
    if (!value) {
      console.log(`  [MISSING]  ${v.key}`);
      console.log(`             ${v.description}`);
      if (v.hint) console.log(`             Hint: ${v.hint}`);
      errors++;
    } else if (v.pattern && !v.pattern.test(value)) {
      console.log(`  [INVALID]  ${v.key} — value doesn't match expected format`);
      if (v.hint) console.log(`             Hint: ${v.hint}`);
      errors++;
    } else {
      console.log(`  [OK]       ${v.key}`);
      passed++;
    }
  }

  // Check important vars
  console.log('\n  IMPORTANT (features degraded without these):');
  for (const v of ENV_SCHEMA.important) {
    const value = process.env[v.key];
    if (!value) {
      console.log(`  [WARN]     ${v.key}`);
      console.log(`             ${v.description}`);
      if (v.features) console.log(`             Affects: ${v.features.join(', ')}`);
      warnings++;
    } else if (v.pattern && !v.pattern.test(value)) {
      console.log(`  [INVALID]  ${v.key} — value doesn't match expected format`);
      warnings++;
    } else {
      console.log(`  [OK]       ${v.key}`);
      passed++;
    }
  }

  // Check optional vars (just informational)
  console.log('\n  OPTIONAL (specific integrations):');
  const missingOptional = [];
  for (const v of ENV_SCHEMA.optional) {
    const value = process.env[v.key];
    if (!value) {
      missingOptional.push(v);
    } else {
      console.log(`  [OK]       ${v.key}`);
      passed++;
    }
  }
  if (missingOptional.length > 0) {
    console.log(`  [INFO]     ${missingOptional.length} optional vars not set:`);
    for (const v of missingOptional) {
      console.log(`             - ${v.key} (${v.features?.join(', ') || v.description})`);
    }
  }

  // Results
  console.log('\n============================================');
  console.log(`Results: ${passed} OK, ${errors} errors, ${warnings} warnings`);
  console.log('============================================\n');

  if (errors > 0) {
    console.log('BLOCKED: Fix critical errors before deploying.\n');
    process.exit(1);
  }

  if (strict && warnings > 0) {
    console.log('BLOCKED (strict mode): Fix warnings before deploying.\n');
    process.exit(1);
  }

  if (warnings > 0) {
    console.log('PASSED with warnings. Some features may be degraded.\n');
  } else {
    console.log('All environment variables validated.\n');
  }
}

// Export for use by orchestrator
module.exports = { ENV_SCHEMA };

// Run if called directly
if (require.main === module) {
  validate();
}
