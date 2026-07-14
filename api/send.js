import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// IMPORTANT:
// During Resend testing, use the SAME email address
// that owns your Resend account as the recipient.
//
// After verifying anantmedia.in or another custom domain,
// the sender can be changed to:
// Anant Media <hello@anantmedia.in>

const CONTACT_EMAIL = "dsbharatiyaproductions@gmail.com";

function cleanText(value, maxLength) {
  if (typeof value !== "string") return "";

  return value
    .trim()
    .replace(/\0/g, "")
    .slice(0, maxLength);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
  }

  try {
    const name = cleanText(req.body?.name, 100);
    const email = cleanText(req.body?.email, 254);
    const ideaType = cleanText(req.body?.ideaType, 100);
    const message = cleanText(req.body?.message, 5000);
    const reference = cleanText(req.body?.reference, 1000);

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address.",
      });
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeIdeaType = escapeHtml(ideaType || "UNSPECIFIED");
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");
    const safeReference = escapeHtml(reference || "NO REFERENCE PROVIDED");

    const { data, error } = await resend.emails.send({
      from: "Anant Media <onboarding@resend.dev>",
      to: [CONTACT_EMAIL],
      replyTo: email,
      subject: `ANANT MEDIA — NEW CONVERSATION / ${
        ideaType || "NEW IDEA"
      }`,
      html: `
        <div style="background:#09090b;padding:48px 24px;font-family:Arial,sans-serif;color:#f4f3ef;">
          <div style="max-width:680px;margin:0 auto;border:1px solid #29292d;background:#111114;padding:48px;">
            
            <p style="margin:0 0 40px;color:#8f8f99;font-size:11px;letter-spacing:4px;">
              ANANT MEDIA / OPEN CHANNEL
            </p>

            <h1 style="margin:0 0 48px;font-size:36px;font-weight:400;letter-spacing:-1px;">
              A NEW IDEA HAS ARRIVED.
            </h1>

            <div style="margin-bottom:32px;">
              <p style="margin:0 0 8px;color:#777780;font-size:10px;letter-spacing:3px;">
                FROM
              </p>
              <p style="margin:0;font-size:18px;">
                ${safeName}
              </p>
            </div>

            <div style="margin-bottom:32px;">
              <p style="margin:0 0 8px;color:#777780;font-size:10px;letter-spacing:3px;">
                EMAIL
              </p>
              <p style="margin:0;font-size:18px;">
                ${safeEmail}
              </p>
            </div>

            <div style="margin-bottom:32px;">
              <p style="margin:0 0 8px;color:#777780;font-size:10px;letter-spacing:3px;">
                IDEA / FIELD
              </p>
              <p style="margin:0;font-size:18px;">
                ${safeIdeaType}
              </p>
            </div>

            <div style="margin:48px 0;padding:32px 0;border-top:1px solid #29292d;border-bottom:1px solid #29292d;">
              <p style="margin:0 0 16px;color:#777780;font-size:10px;letter-spacing:3px;">
                THE IDEA
              </p>
              <p style="margin:0;color:#d6d5d1;font-size:17px;line-height:1.8;">
                ${safeMessage}
              </p>
            </div>

            <div style="margin-bottom:48px;">
              <p style="margin:0 0 8px;color:#777780;font-size:10px;letter-spacing:3px;">
                LINK / REFERENCE
              </p>
              <p style="margin:0;color:#aaaab2;font-size:15px;word-break:break-word;">
                ${safeReference}
              </p>
            </div>

            <p style="margin:0;color:#5f5f68;font-size:10px;letter-spacing:3px;">
              STORIES. FRAMES. IDEAS. WITHOUT END.
            </p>

          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);

      return res.status(500).json({
        success: false,
        message: "The channel did not open.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Channel open.",
      id: data?.id,
    });
  } catch (error) {
    console.error("Contact API error:", error);

    return res.status(500).json({
      success: false,
      message: "The channel did not open.",
    });
  }
}