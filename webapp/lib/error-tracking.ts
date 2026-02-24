/**
 * Lightweight Error Tracking
 *
 * Reports errors to Sentry via their REST API (zero-dependency).
 * Set SENTRY_DSN and optionally SENTRY_ENVIRONMENT to enable.
 *
 * When SENTRY_DSN is not set, errors are only logged to console.
 * This can be replaced with `@sentry/nextjs` for full SDK features
 * (session replay, performance tracing, breadcrumbs) once installed.
 */

const SENTRY_DSN = process.env.SENTRY_DSN || '';
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || process.env.NEXT_PUBLIC_ENVIRONMENT || 'development';

// Parse DSN: https://<key>@<host>/<project_id>
let sentryKey = '';
let sentryHost = '';
let sentryProjectId = '';

if (SENTRY_DSN) {
  try {
    const url = new URL(SENTRY_DSN);
    sentryKey = url.username;
    sentryHost = url.host;
    sentryProjectId = url.pathname.replace('/', '');
  } catch {
    console.warn('[ErrorTracking] Invalid SENTRY_DSN format');
  }
}

const isEnabled = !!(sentryKey && sentryHost && sentryProjectId);

interface ErrorContext {
  /** Where the error happened (e.g. 'api/email/send', 'Navbar') */
  source?: string;
  /** Additional key-value data to attach */
  extra?: Record<string, unknown>;
  /** User ID if available */
  userId?: string;
  /** Error level */
  level?: 'error' | 'warning' | 'info';
}

/**
 * Report an error to Sentry (non-blocking, fire-and-forget).
 * Safe to call anywhere — never throws.
 */
export function captureException(error: unknown, context?: ErrorContext): void {
  const err = error instanceof Error ? error : new Error(String(error));
  const level = context?.level || 'error';

  // Always log to console
  console[level === 'error' ? 'error' : 'warn'](
    `[${context?.source || 'App'}]`,
    err.message,
    context?.extra || '',
  );

  if (!isEnabled) return;

  // Build Sentry envelope (non-blocking)
  const eventId = crypto.randomUUID().replace(/-/g, '');
  const timestamp = Date.now() / 1000;

  const event = {
    event_id: eventId,
    timestamp,
    level,
    platform: 'node',
    environment: SENTRY_ENVIRONMENT,
    exception: {
      values: [
        {
          type: err.name,
          value: err.message,
          stacktrace: err.stack
            ? {
                frames: err.stack
                  .split('\n')
                  .slice(1, 10)
                  .map((line: string) => {
                    const match = line.match(/at\s+(.+)\s+\((.+):(\d+):(\d+)\)/);
                    if (match) {
                      return {
                        function: match[1],
                        filename: match[2],
                        lineno: parseInt(match[3]),
                        colno: parseInt(match[4]),
                      };
                    }
                    return { filename: line.trim() };
                  })
                  .reverse(),
              }
            : undefined,
        },
      ],
    },
    tags: {
      source: context?.source || 'unknown',
    },
    extra: context?.extra || {},
    user: context?.userId ? { id: context.userId } : undefined,
  };

  // Fire and forget — don't await, don't block
  const envelopeUrl = `https://${sentryHost}/api/${sentryProjectId}/envelope/?sentry_key=${sentryKey}&sentry_version=7`;
  const header = JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() });
  const itemHeader = JSON.stringify({ type: 'event', length: JSON.stringify(event).length });
  const body = `${header}\n${itemHeader}\n${JSON.stringify(event)}`;

  fetch(envelopeUrl, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/x-sentry-envelope' },
  }).catch(() => {
    // Silently ignore — error tracking should never cause errors
  });
}

/**
 * Capture a message (non-error) to Sentry.
 */
export function captureMessage(
  message: string,
  context?: Omit<ErrorContext, 'level'> & { level?: 'info' | 'warning' },
): void {
  captureException(new Error(message), { ...context, level: context?.level || 'info' });
}
