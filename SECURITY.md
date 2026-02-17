# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| Latest  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in GreenLine365, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email: **security@greenline365.com**

You can expect:
- Acknowledgment within 48 hours
- A status update within 5 business days
- Credit in the fix announcement (if desired)

## Scope

This policy covers:
- The greenline365-web application (webapp/)
- API routes and server-side logic
- Database migrations and Supabase Edge Functions
- Client-side code that handles sensitive data

## Out of Scope

- Third-party services (Stripe, Twilio, Cal.com, etc.) — report to those vendors directly
- Social engineering attacks
- Denial of service attacks

## Security Practices

- All secrets are managed via environment variables (never committed to source)
- Supabase Row Level Security (RLS) is enabled on sensitive tables
- API routes validate input and use parameterized queries
- HTTPS is enforced via Vercel
