import { Resend } from "resend";

const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;

const FROM_EMAIL = process.env.FROM_EMAIL || "Donna <donna@benedara.com>";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email via Resend.
 */
export async function sendEmail(params: SendEmailParams): Promise<{ id: string }> {
  if (!resend) {
    console.log(`[email] Would send to ${params.to}: ${params.subject}`);
    return { id: "dev-no-send" };
  }

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.html.replace(/<[^>]*>/g, ''), // Fallback plain text
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return { id: data?.id || "" };
}

/**
 * Convert plain text with line breaks to HTML paragraphs
 */
function formatEmailBody(text: string): string {
  // Split by double newlines to get paragraphs
  const paragraphs = text
    .trim()
    .split(/\n\n+/)
    .filter(p => p.trim().length > 0);

  // Wrap each paragraph in <p> tags
  return paragraphs
    .map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/**
 * Wrap re-engagement email body in a beautifully designed HTML template.
 * Design: Personal Letter from Donna - intimate, handwritten feel
 */
export function wrapEmailHtml(body: string, magicLinkUrl: string, unsubscribeUrl: string): string {
  const formattedBody = formatEmailBody(body);
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Georgia, 'Times New Roman', serif !important; }
  </style>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');

    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    * { margin: 0; padding: 0; box-sizing: border-box; }

    /* Base styles */
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background: #f7f9fc;
      font-family: 'Crimson Text', Georgia, serif;
    }

    /* Container */
    .email-container {
      max-width: 560px;
      margin: 0 auto;
      background-color: transparent;
    }

    /* Decorative top spacer */
    .top-spacer {
      height: 40px;
      background: transparent;
    }

    /* Simple header - from Donna */
    .header {
      background: transparent;
      padding: 24px 32px 16px 32px;
      text-align: left;
    }

    .sender-photo {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(45, 106, 175, 0.15);
      display: block;
    }

    .from-line {
      margin: 0;
      color: #5b8ab8;
      font-size: 13px;
      font-weight: 400;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      font-family: 'Libre Baskerville', Georgia, serif;
    }

    .sender-name {
      margin: 4px 0 0 0;
      color: #3b4f5e;
      font-size: 26px;
      font-weight: 400;
      font-style: italic;
      font-family: 'Crimson Text', Georgia, serif;
    }

    /* Letter content */
    .content-card {
      background: linear-gradient(to bottom, #ffffff 0%, #fcfdfe 100%);
      padding: 40px 40px 48px 40px;
      margin: 0 24px;
      box-shadow:
        0 1px 3px rgba(45, 106, 175, 0.06),
        0 8px 24px rgba(45, 106, 175, 0.04);
      border: 1px solid rgba(45, 106, 175, 0.08);
      border-radius: 2px;
      position: relative;
    }

    .message-body {
      color: #3b4f5e;
      font-size: 18px;
      line-height: 1.75;
      margin: 0;
      font-family: 'Crimson Text', Georgia, serif;
      font-weight: 400;
    }

    .message-body p {
      margin: 0 0 20px 0;
    }

    .message-body p:last-child {
      margin-bottom: 0;
    }

    /* Simple divider */
    .divider {
      height: 1px;
      background: rgba(45, 106, 175, 0.12);
      margin: 36px 0;
    }

    /* Reply section */
    .cta-section {
      text-align: left;
      padding: 8px 0 0 0;
    }

    .cta-text {
      margin: 0 0 12px 0;
      color: #5b7b9a;
      font-size: 15px;
      font-style: italic;
      font-family: 'Crimson Text', Georgia, serif;
    }

    .cta-button {
      display: inline-block;
      padding: 12px 28px;
      background: #2D6AAF;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 3px;
      font-size: 15px;
      font-weight: 400;
      letter-spacing: 0.3px;
      font-family: 'Libre Baskerville', Georgia, serif;
      box-shadow: 0 2px 8px rgba(45, 106, 175, 0.15);
      transition: all 0.3s ease;
    }

    .cta-button:hover {
      background: #245889;
      box-shadow: 0 4px 12px rgba(45, 106, 175, 0.2);
      transform: translateY(-1px);
    }

    /* Minimal footer */
    .footer {
      background: transparent;
      padding: 32px 24px 40px 24px;
      text-align: center;
    }

    .footer-text {
      margin: 0 0 8px 0;
      color: rgba(91, 138, 184, 0.5);
      font-size: 12px;
      font-weight: 400;
      font-family: 'Crimson Text', Georgia, serif;
    }

    .footer-links {
      margin: 0;
      color: rgba(91, 138, 184, 0.45);
      font-size: 11px;
    }

    .footer-links a {
      color: rgba(91, 138, 184, 0.6);
      text-decoration: none;
      border-bottom: 1px solid rgba(45, 106, 175, 0.2);
      transition: all 0.3s ease;
    }

    .footer-links a:hover {
      color: rgba(91, 138, 184, 0.85);
      border-bottom-color: rgba(45, 106, 175, 0.4);
    }

    .bottom-spacer {
      height: 40px;
      background: transparent;
    }

    /* Responsive */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
      }

      .top-spacer, .bottom-spacer {
        height: 24px !important;
      }

      .header {
        padding: 20px 24px 12px 24px !important;
      }

      .sender-photo {
        width: 56px !important;
        height: 56px !important;
      }

      .from-line {
        font-size: 12px !important;
      }

      .sender-name {
        font-size: 22px !important;
      }

      .content-card {
        margin: 0 16px !important;
        padding: 32px 24px 36px 24px !important;
      }

      .message-body {
        font-size: 17px !important;
        line-height: 1.7 !important;
      }

      .cta-button {
        padding: 11px 24px !important;
        font-size: 14px !important;
      }

      .footer {
        padding: 28px 24px 36px 24px !important;
      }
    }
  </style>
</head>
<body>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="email-container">

          <!-- Top Spacer -->
          <tr>
            <td class="top-spacer"></td>
          </tr>

          <!-- Simple header -->
          <tr>
            <td class="header">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align: middle; padding-right: 16px;">
                    <img src="${process.env.DONNA_AVATAR_URL || "https://via.placeholder.com/64"}" alt="Donna" class="sender-photo" width="64" height="64">
                  </td>
                  <td style="vertical-align: middle;">
                    <div class="sender-info">
                      <p class="from-line">A message from</p>
                      <p class="sender-name">Donna</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Letter content -->
          <tr>
            <td class="content-card">
              <div class="message-body">
                ${formattedBody}
              </div>

              <div class="divider"></div>

              <div class="cta-section">
                <p class="cta-text">I'm here whenever you'd like to talk.</p>
                <a href="${magicLinkUrl}" class="cta-button">Continue our conversation</a>
              </div>
            </td>
          </tr>

          <!-- Minimal footer -->
          <tr>
            <td class="footer">
              <p class="footer-text">Sent from Benedara</p>
              <p class="footer-links">
                <a href="${unsubscribeUrl}">Unsubscribe</a>
              </p>
            </td>
          </tr>

          <!-- Bottom Spacer -->
          <tr>
            <td class="bottom-spacer"></td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
