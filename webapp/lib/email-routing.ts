/**
 * Dynamic Email Routing
 *
 * Implements the conditional "Environment Switch" for email notifications.
 * In test mode, routes emails to TEST_PERSONAL_EMAIL.
 * In production mode, routes to the actual customer email.
 */

const TEST_PERSONAL_EMAIL = process.env.TEST_PERSONAL_EMAIL || 'jared.tucker13@gmail.com';

interface EmailPayload {
  customer_email: string;
  customer_name: string;
  service_type: string;
  formatted_time: string;
  booking_id?: string;
  staff_assigned?: string;
  confirmation_number?: string;
  business_name?: string;
}

interface RoutedEmail {
  to: string;
  subject: string;
  html: string;
  plain: string;
  is_test_mode: boolean;
}

/**
 * Get the email recipient based on test mode
 */
export function getEmailRecipient(is_test_mode: boolean, customer_email: string): string {
  return is_test_mode ? TEST_PERSONAL_EMAIL : customer_email;
}

/**
 * Build a booking confirmation email with dynamic variables
 */
export function buildBookingConfirmationEmail(
  payload: EmailPayload,
  is_test_mode: boolean
): RoutedEmail {
  const recipient = getEmailRecipient(is_test_mode, payload.customer_email);

  const subject = is_test_mode
    ? `[TEST] Booking Confirmed - ${payload.customer_name}`
    : `Booking Confirmed - ${payload.service_type} on ${payload.formatted_time}`;

  const html = buildBookingHtmlTemplate(payload, is_test_mode);
  const plain = buildBookingPlainTemplate(payload, is_test_mode);

  return { to: recipient, subject, html, plain, is_test_mode };
}

function buildBookingHtmlTemplate(payload: EmailPayload, is_test_mode: boolean): string {
  const {
    customer_name,
    service_type,
    formatted_time,
    confirmation_number,
    staff_assigned,
    business_name,
  } = payload;

  const testBanner = is_test_mode
    ? `<div style="background: #FF6B35; color: white; padding: 10px; text-align: center; font-weight: bold;">
        TEST MODE - Original recipient: ${payload.customer_email}
       </div>`
    : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#0a0a0a;color:#ffffff;">
  ${testBanner}
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:30px;">
      <div style="display:inline-block;background:linear-gradient(135deg,#39FF14,#0CE293);padding:12px 24px;border-radius:12px;">
        <span style="font-size:20px;font-weight:bold;color:#000;">${business_name || 'GreenLine365'}</span>
      </div>
    </div>

    <div style="background:#1a1a1a;border:1px solid #333;border-radius:16px;padding:32px;margin-bottom:24px;">
      <h1 style="color:#39FF14;margin:0 0 8px;font-size:24px;">Booking Confirmed</h1>
      <p style="color:#ccc;margin:0 0 24px;font-size:14px;">Your appointment has been successfully scheduled.</p>

      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #333;color:#888;font-size:13px;">Customer</td>
          <td style="padding:12px 0;border-bottom:1px solid #333;color:#fff;font-size:14px;text-align:right;">${customer_name}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #333;color:#888;font-size:13px;">Service</td>
          <td style="padding:12px 0;border-bottom:1px solid #333;color:#fff;font-size:14px;text-align:right;">${service_type}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #333;color:#888;font-size:13px;">Date & Time</td>
          <td style="padding:12px 0;border-bottom:1px solid #333;color:#39FF14;font-size:14px;font-weight:bold;text-align:right;">${formatted_time}</td>
        </tr>
        ${staff_assigned ? `<tr>
          <td style="padding:12px 0;border-bottom:1px solid #333;color:#888;font-size:13px;">Staff Assigned</td>
          <td style="padding:12px 0;border-bottom:1px solid #333;color:#fff;font-size:14px;text-align:right;">${staff_assigned}</td>
        </tr>` : ''}
        ${confirmation_number ? `<tr>
          <td style="padding:12px 0;color:#888;font-size:13px;">Confirmation #</td>
          <td style="padding:12px 0;color:#FFD700;font-size:14px;font-weight:bold;text-align:right;">${confirmation_number}</td>
        </tr>` : ''}
      </table>
    </div>

    <p style="color:#666;font-size:12px;text-align:center;">
      Need to reschedule? Reply to this email or call us directly.
    </p>
  </div>
</body>
</html>`;
}

function buildBookingPlainTemplate(payload: EmailPayload, is_test_mode: boolean): string {
  const { customer_name, service_type, formatted_time, confirmation_number, staff_assigned } = payload;

  let text = '';
  if (is_test_mode) {
    text += `[TEST MODE - Original recipient: ${payload.customer_email}]\n\n`;
  }

  text += `BOOKING CONFIRMED\n`;
  text += `=================\n\n`;
  text += `Customer: ${customer_name}\n`;
  text += `Service: ${service_type}\n`;
  text += `Date & Time: ${formatted_time}\n`;
  if (staff_assigned) text += `Staff: ${staff_assigned}\n`;
  if (confirmation_number) text += `Confirmation #: ${confirmation_number}\n`;
  text += `\nNeed to reschedule? Reply to this email or call us directly.`;

  return text;
}

export type { EmailPayload, RoutedEmail };
