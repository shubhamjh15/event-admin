import "server-only";
import crypto from "crypto";
import nodemailer, { type Transporter } from "nodemailer";
import type { SiteSettings } from "./data";

/**
 * Outgoing email over SMTP (works with Gmail app passwords, Zoho, Outlook, Resend, SES, Brevo…).
 * Configure with SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and optionally MAIL_FROM.
 * When SMTP isn't configured, sending is skipped (and reported) — forms keep working.
 */

let transport: Transporter | null | undefined;

export function mailConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransport() {
  if (transport !== undefined) return transport;
  if (!mailConfigured()) return (transport = null);
  const port = Number(process.env.SMTP_PORT || 465);
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    pool: false,
  });
  return transport;
}

export type MailResult = { sent: boolean; skipped?: boolean; error?: string };

export async function sendMail(msg: { to: string; subject: string; html: string; text: string; replyTo?: string; headers?: Record<string, string> }, siteName = "Lit Concierge"): Promise<MailResult> {
  const t = getTransport();
  if (!t) return { sent: false, skipped: true, error: "Email not configured (SMTP_* variables missing)" };
  if (!msg.to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(msg.to)) return { sent: false, error: "Invalid recipient" };
  try {
    await t.sendMail({
      from: process.env.MAIL_FROM || `"${siteName}" <${process.env.SMTP_USER}>`,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      replyTo: msg.replyTo,
      headers: msg.headers,
    });
    return { sent: true };
  } catch (e: any) {
    console.error("[mail]", e?.message || e);
    return { sent: false, error: String(e?.message || e).slice(0, 200) };
  }
}

export function adminInbox(s: SiteSettings) {
  return process.env.ADMIN_NOTIFY_EMAIL || (s as any).notifyEmail || s.email;
}

/* ---------------- Templates ---------------- */

export const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const SITE = () => (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");

/** Brand shell: table layout + inline styles so it renders in Gmail, Outlook and Apple Mail. */
export function layout(s: SiteSettings, opts: { preheader: string; title: string; body: string; cta?: { label: string; href: string }; footerNote?: string }) {
  const site = SITE();
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(opts.title)}</title></head>
<body style="margin:0;padding:0;background:#F2EADC;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2EADC;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FAF6EF;border:1px solid #E3D8C4;">
<tr><td style="padding:28px 36px 20px;border-bottom:1px solid #E3D8C4;text-align:center;">
<div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:34px;line-height:1;color:#16130F;">Lit</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:5px;text-transform:uppercase;color:#16130F;margin-top:4px;">Concierge</div>
</td></tr>
<tr><td style="padding:36px 36px 8px;">
<h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:28px;line-height:1.2;color:#16130F;">${opts.title}</h1>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#3D362D;">${opts.body}</div>
${opts.cta ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;"><tr><td style="background:#16130F;"><a href="${esc(opts.cta.href)}" style="display:inline-block;padding:14px 26px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#FAF6EF;text-decoration:none;">${esc(opts.cta.label)}</a></td></tr></table>` : ""}
</td></tr>
<tr><td style="padding:28px 36px 32px;">
<div style="border-top:1px solid #E3D8C4;padding-top:20px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.7;color:#6B6052;">
<strong style="color:#16130F;">${esc(s.siteName)}</strong> · Est. ${esc(s.since)} · Licensed · Bonded · Insured<br>
${esc(s.phone)} · <a href="mailto:${esc(s.email)}" style="color:#C41D61;">${esc(s.email)}</a><br>
${esc(s.address)}${site ? `<br><a href="${site}" style="color:#C41D61;">${esc(site.replace(/^https?:\/\//, ""))}</a>` : ""}
${opts.footerNote ? `<br><br>${opts.footerNote}` : ""}
</div></td></tr>
</table>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#8A7F70;margin-top:14px;">Powered by Techserve Nexus</div>
</td></tr></table></body></html>`;
}

/** Two-column details table for admin notifications. */
export function detailsTable(rows: [string, unknown][]) {
  const r = rows.filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 4px;">${r
    .map(
      ([k, v]) =>
        `<tr><td style="padding:9px 12px 9px 0;border-bottom:1px solid #E3D8C4;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#6B6052;width:34%;vertical-align:top;">${esc(k)}</td><td style="padding:9px 0;border-bottom:1px solid #E3D8C4;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#16130F;white-space:pre-wrap;">${esc(v)}</td></tr>`,
    )
    .join("")}</table>`;
}

export const detailsText = (rows: [string, unknown][]) =>
  rows.filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "").map(([k, v]) => `${k}: ${v}`).join("\n");

/* ---------------- Newsletter unsubscribe tokens ---------------- */

function unsubSecret() {
  return process.env.JWT_SECRET || "dev-only-secret-change-me";
}
export function unsubscribeToken(email: string) {
  return crypto.createHmac("sha256", unsubSecret()).update(email.toLowerCase()).digest("base64url").slice(0, 32);
}
export function verifyUnsubscribe(email: string, token: string) {
  const a = Buffer.from(unsubscribeToken(email));
  const b = Buffer.from(String(token || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export function unsubscribeUrl(email: string) {
  return `${SITE()}/api/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubscribeToken(email)}`;
}
