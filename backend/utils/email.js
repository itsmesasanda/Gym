import nodemailer from "nodemailer";

// Lazily build a transport from SMTP env vars. Returns null when SMTP isn't
// configured, so the app degrades gracefully (the reset code is logged instead).
let _transport = null;
const getTransport = () => {
  if (_transport) return _transport;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  _transport = nodemailer.createTransport({
    host:   SMTP_HOST,
    port:   Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465, // implicit TLS on 465, STARTTLS otherwise
    auth:   { user: SMTP_USER, pass: SMTP_PASS },
  });
  return _transport;
};

/**
 * Best-effort delivery of a password reset code. Never throws — on any failure
 * (or when SMTP is unconfigured) it logs the code so support can still help and
 * the caller can keep returning a generic response.
 */
export const sendPasswordResetEmail = async (to, code) => {
  const transport = getTransport();
  if (!transport) {
    console.log(`[email] SMTP not configured — password reset code for ${to}: ${code}`);
    return;
  }
  try {
    await transport.sendMail({
      from:    process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: "Your GymApp password reset code",
      text:
        `Your GymApp password reset code is ${code}.\n\n` +
        `It expires in 15 minutes. If you didn't request this, you can ignore this email.`,
    });
  } catch (e) {
    console.error(`[email] Failed to send reset email to ${to}:`, e.message);
  }
};
