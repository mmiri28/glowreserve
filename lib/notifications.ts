function getResend() {
  const { Resend } = require("resend");
  return new Resend(process.env.RESEND_API_KEY || "placeholder");
}

const BASE_STYLE = `
  font-family: 'Helvetica Neue', Arial, sans-serif;
  margin: 0; padding: 0; background: #FDFBF7;
`;

function emailWrapper(content: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
</head>
<body style="${BASE_STYLE}">
  <div style="max-width:580px;margin:40px auto;padding:0 20px;">
    <!-- Logo -->
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:24px;font-weight:700;color:#1A1A1A;">
        Glow<span style="color:#D4AF37;">Reserve</span>
      </span>
    </div>
    ${content}
    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid #E8E2D9;">
      <p style="font-size:13px;color:#8A8680;margin:0;">
        GlowReserve · Premium Beauty Marketplace
      </p>
      <p style="font-size:12px;color:#C4BFB9;margin:6px 0 0;">
        You received this because you have an account on GlowReserve.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function detailRow(icon: string, label: string, value: string) {
  return `
  <tr>
    <td style="padding:12px 0;border-bottom:1px solid #F5F0E8;color:#8A8680;font-size:14px;width:40%;">
      ${icon} ${label}
    </td>
    <td style="padding:12px 0;border-bottom:1px solid #F5F0E8;color:#1A1A1A;font-weight:600;font-size:14px;">
      ${value}
    </td>
  </tr>`;
}

export async function sendBookingCreatedEmail({
  ownerEmail,
  ownerName,
  customerName,
  serviceName,
  businessName,
  slotDatetime,
  customerPhone,
}: {
  ownerEmail: string;
  ownerName?: string;
  customerName: string;
  serviceName: string;
  businessName: string;
  slotDatetime: string;
  bookingId?: string;
  customerPhone?: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log("Resend not configured, skipping email");
    return;
  }

  const resend = getResend();
  const formatted = new Date(slotDatetime).toLocaleString("en-US", {
    weekday: "long", month: "long", day: "numeric",
    year: "numeric", hour: "numeric", minute: "2-digit",
  });
  const approveUrl = `${process.env.NEXT_PUBLIC_APP_URL}/business/dashboard/appointments`;

  const content = `
  <div style="background:linear-gradient(135deg,#1A1A1A,#2D2D2D);border-radius:16px 16px 0 0;padding:36px 32px;text-align:center;">
    <div style="width:56px;height:56px;background:linear-gradient(135deg,#D4AF37,#B8941F);border-radius:14px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:24px;">
      📅
    </div>
    <h1 style="color:#D4AF37;font-size:22px;margin:0;font-weight:700;">New Booking Request!</h1>
    <p style="color:rgba(255,255,255,0.6);font-size:14px;margin:8px 0 0;">
      ${customerName} wants to visit ${businessName}
    </p>
  </div>
  <div style="background:white;padding:32px;border:1px solid #E8E2D9;border-top:none;border-radius:0 0 16px 16px;">
    <p style="color:#1A1A1A;font-size:15px;margin:0 0 24px;">
      Hi ${ownerName || "there"}, you have a new booking request waiting for your approval.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
      ${detailRow("👤", "Customer", customerName)}
      ${detailRow("✂️", "Service", serviceName)}
      ${detailRow("🗓", "Date & Time", formatted)}
      ${customerPhone ? detailRow("📱", "Phone", customerPhone) : ""}
    </table>
    <a href="${approveUrl}"
      style="display:block;text-align:center;background:linear-gradient(135deg,#D4AF37,#B8941F);color:white;padding:15px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;margin-bottom:12px;">
      ✓ Approve Booking
    </a>
    <p style="font-size:12px;color:#8A8680;text-align:center;margin:0;">
      Log in to your dashboard to approve or decline this request.
    </p>
  </div>`;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@glowreserve.com",
      to: ownerEmail,
      subject: `📅 New Booking Request — ${customerName} wants ${serviceName}`,
      html: emailWrapper(content),
    });
  } catch (err) {
    console.error("Owner email error:", err);
  }
}

export async function sendBookingConfirmedEmail({
  customerEmail,
  customerName,
  serviceName,
  businessName,
  businessAddress,
  businessPhone,
  slotDatetime,
}: {
  customerEmail: string;
  customerName: string;
  serviceName: string;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  slotDatetime: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log("Resend not configured, skipping email");
    return;
  }

  const resend = getResend();
  const formatted = new Date(slotDatetime).toLocaleString("en-US", {
    weekday: "long", month: "long", day: "numeric",
    year: "numeric", hour: "numeric", minute: "2-digit",
  });

  const content = `
  <div style="background:linear-gradient(135deg,#D4AF37,#B8941F);border-radius:16px 16px 0 0;padding:36px 32px;text-align:center;">
    <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:28px;">
      ✅
    </div>
    <h1 style="color:white;font-size:24px;margin:0;font-weight:700;">Booking Confirmed!</h1>
    <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0;">Your appointment is all set</p>
  </div>
  <div style="background:white;padding:32px;border:1px solid #E8E2D9;border-top:none;border-radius:0 0 16px 16px;">
    <p style="color:#1A1A1A;font-size:15px;margin:0 0 24px;">
      Hi ${customerName}! Your booking has been confirmed. We can't wait to see you ✨
    </p>
    <div style="background:linear-gradient(135deg,#FDFBF7,#F5F0E8);border-radius:12px;padding:24px;margin-bottom:28px;border:1px solid #E8E2D9;">
      <table style="width:100%;border-collapse:collapse;">
        ${detailRow("✂️", "Service", serviceName)}
        ${detailRow("🏠", "Location", businessName)}
        ${detailRow("🗓", "Date", formatted)}
        ${businessAddress ? detailRow("📍", "Address", businessAddress) : ""}
        ${businessPhone ? detailRow("📱", "Phone", businessPhone) : ""}
      </table>
    </div>
    <div style="background:#FFF8E8;border-radius:10px;padding:16px;border-left:4px solid #D4AF37;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#1A1A1A;font-weight:600;">
        ⏰ Please arrive 5 minutes early
      </p>
      <p style="margin:6px 0 0;font-size:13px;color:#8A8680;">
        This helps ensure your full treatment time and a smooth experience.
      </p>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/appointments"
      style="display:block;text-align:center;background:linear-gradient(135deg,#D4AF37,#B8941F);color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
      View My Appointment
    </a>
  </div>`;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@glowreserve.com",
      to: customerEmail,
      subject: `✅ Confirmed! ${serviceName} at ${businessName}`,
      html: emailWrapper(content),
    });
  } catch (err) {
    console.error("Confirmation email error:", err);
  }
}

export async function sendBookingCancelledEmail({
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
  if (!process.env.RESEND_API_KEY) return;
  const resend = getResend();
  const formatted = new Date(slotDatetime).toLocaleString("en-US", {
    weekday: "long", month: "long", day: "numeric",
    year: "numeric", hour: "numeric", minute: "2-digit",
  });

  const content = `
  <div style="background:linear-gradient(135deg,#1A1A1A,#2D2D2D);border-radius:16px 16px 0 0;padding:32px;text-align:center;">
    <h1 style="color:white;font-size:22px;margin:0;">Booking Cancelled</h1>
    <p style="color:#8A8680;font-size:14px;margin:8px 0 0;">Your appointment has been cancelled</p>
  </div>
  <div style="background:white;padding:32px;border:1px solid #E8E2D9;border-top:none;border-radius:0 0 16px 16px;">
    <p style="color:#1A1A1A;font-size:15px;">Hi ${customerName}, unfortunately your booking has been cancelled.</p>
    <div style="background:#FDECEC;border-radius:10px;padding:20px;margin:20px 0;border:1px solid #F5C6C6;">
      <p style="margin:0;font-weight:600;color:#1A1A1A;">${serviceName}</p>
      <p style="margin:4px 0 0;color:#8A8680;">📍 ${businessName}</p>
      <p style="margin:4px 0 0;color:#8A8680;">🗓 ${formatted}</p>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/explore"
      style="display:block;text-align:center;background:linear-gradient(135deg,#D4AF37,#B8941F);color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
      Find Another Provider
    </a>
  </div>`;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@glowreserve.com",
      to: customerEmail,
      subject: `Booking Cancelled — ${serviceName} at ${businessName}`,
      html: emailWrapper(content),
    });
  } catch (err) {
    console.error("Cancellation email error:", err);
  }
}

export async function sendReminderEmail({
  customerEmail,
  customerName,
  serviceName,
  businessName,
  businessAddress,
  slotDatetime,
  hoursUntil,
}: {
  customerEmail: string;
  customerName: string;
  serviceName: string;
  businessName: string;
  businessAddress?: string;
  slotDatetime: string;
  hoursUntil: number;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const resend = getResend();
  const formatted = new Date(slotDatetime).toLocaleString("en-US", {
    weekday: "long", month: "long", day: "numeric",
    year: "numeric", hour: "numeric", minute: "2-digit",
  });
  const timeLabel = hoursUntil >= 24 ? "tomorrow" : `in ${hoursUntil} hours`;

  const content = `
  <div style="background:linear-gradient(135deg,#1A1A1A,#2D2D2D);border-radius:16px 16px 0 0;padding:32px;text-align:center;">
    <div style="font-size:36px;margin-bottom:12px;">⏰</div>
    <h1 style="color:#D4AF37;font-size:22px;margin:0;">Appointment Reminder</h1>
    <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:8px 0 0;">
      Your appointment is ${timeLabel}!
    </p>
  </div>
  <div style="background:white;padding:32px;border:1px solid #E8E2D9;border-top:none;border-radius:0 0 16px 16px;">
    <p style="color:#1A1A1A;font-size:15px;">Hi ${customerName}, just a friendly reminder about your upcoming appointment!</p>
    <div style="background:#FDFBF7;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #E8E2D9;">
      <table style="width:100%;border-collapse:collapse;">
        ${detailRow("✂️", "Service", serviceName)}
        ${detailRow("🏠", "At", businessName)}
        ${detailRow("🗓", "When", formatted)}
        ${businessAddress ? detailRow("📍", "Address", businessAddress) : ""}
      </table>
    </div>
    <div style="background:#FFF8E8;border-radius:10px;padding:14px;border-left:4px solid #D4AF37;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#8A8680;">
        💡 Tip: Arrive 5 minutes early for your best experience.
      </p>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/appointments"
      style="display:block;text-align:center;background:linear-gradient(135deg,#D4AF37,#B8941F);color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;">
      View Appointment Details
    </a>
  </div>`;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@glowreserve.com",
      to: customerEmail,
      subject: `⏰ Reminder: ${serviceName} at ${businessName} ${timeLabel}`,
      html: emailWrapper(content),
    });
  } catch (err) {
    console.error("Reminder email error:", err);
  }
}

export async function sendSMS(to: string, body: string) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log("Twilio not configured, skipping SMS");
    return;
  }
  try {
    const auth = Buffer.from(
      `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
    ).toString("base64");
    await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: process.env.TWILIO_PHONE_NUMBER!,
          To: to,
          Body: body,
        }),
      }
    );
  } catch (err) {
    console.error("SMS error:", err);
  }
}