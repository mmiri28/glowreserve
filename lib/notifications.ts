function getResend() {
  const { Resend } = require("resend");
  return new Resend(process.env.RESEND_API_KEY || "placeholder");
}

export async function sendBookingCreatedEmail({
  ownerEmail,
  customerName,
  serviceName,
  businessName,
  slotDatetime,
}: {
  ownerEmail: string;
  ownerName?: string;
  customerName: string;
  serviceName: string;
  businessName: string;
  slotDatetime: string;
  bookingId?: string;
}) {
  if (!process.env.RESEND_API_KEY) { console.log("Resend not configured, skipping email"); return; }
  const resend = getResend();
  const date = new Date(slotDatetime);
  const formatted = date.toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  const approveUrl = `${process.env.NEXT_PUBLIC_APP_URL}/business/dashboard/appointments`;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@glowreserve.com",
      to: ownerEmail,
      subject: `New Booking Request — ${customerName} wants ${serviceName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#FDFBF7;padding:40px 20px">
          <div style="background:linear-gradient(135deg,#1A1A1A,#2D2D2D);border-radius:16px 16px 0 0;padding:32px;text-align:center">
            <h1 style="color:#D4AF37;font-size:22px;margin:0">New Booking Request!</h1>
            <p style="color:#8A8680;font-size:14px;margin:8px 0 0">Someone wants to visit ${businessName}</p>
          </div>
          <div style="background:white;padding:32px;border:1px solid #E8E2D9;border-radius:0 0 16px 16px">
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Service:</strong> ${serviceName}</p>
            <p><strong>Date:</strong> ${formatted}</p>
            <a href="${approveUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#D4AF37,#B8941F);color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;margin-top:24px">Review &amp; Approve →</a>
          </div>
        </div>
      `,
    });
  } catch (err) { console.error("Owner email error:", err); }
}

export async function sendBookingConfirmedEmail({
  customerEmail,
  customerName,
  serviceName,
  businessName,
  slotDatetime,
}: {
  customerEmail: string;
  customerName: string;
  serviceName: string;
  businessName: string;
  slotDatetime: string;
}) {
  if (!process.env.RESEND_API_KEY) { console.log("Resend not configured, skipping email"); return; }
  const resend = getResend();
  const formatted = new Date(slotDatetime).toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@glowreserve.com",
      to: customerEmail,
      subject: `Booking Confirmed ✓ — ${serviceName} at ${businessName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
          <div style="background:linear-gradient(135deg,#D4AF37,#B8941F);padding:32px;text-align:center;border-radius:16px 16px 0 0">
            <h1 style="color:white;font-size:22px;margin:0">Booking Confirmed! ✅</h1>
          </div>
          <div style="background:white;padding:32px;border:1px solid #E8E2D9;border-radius:0 0 16px 16px">
            <p>Hi ${customerName},</p>
            <div style="background:#F5F0E8;border-radius:12px;padding:20px;margin:16px 0">
              <p style="margin:0 0 8px;font-weight:700">${serviceName}</p>
              <p style="margin:0 0 4px;color:#8A8680">📍 ${businessName}</p>
              <p style="margin:0;color:#8A8680">🗓 ${formatted}</p>
            </div>
            <p style="color:#D4AF37;font-weight:600">Please arrive 5 minutes early. 🌟</p>
          </div>
        </div>
      `,
    });
  } catch (err) { console.error("Confirmation email error:", err); }
}

export async function sendSMS(to: string, body: string) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) { console.log("Twilio not configured, skipping SMS"); return; }
  try {
    const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ From: process.env.TWILIO_PHONE_NUMBER!, To: to, Body: body }),
    });
  } catch (err) { console.error("SMS error:", err); }
}
