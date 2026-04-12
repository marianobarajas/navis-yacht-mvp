/**
 * Transactional email via Resend (https://resend.com). Set RESEND_API_KEY and optionally RESEND_FROM.
 */

const NAVY = "#1e4a52";
const SAND = "#e8dcc8";

/** Public site URL for links in emails (invite, etc.). */
function appBaseUrl() {
  const vercel = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
  const u =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    vercel ||
    "http://localhost:3000";
  return u.replace(/\/$/, "");
}

export function buildInviteEmailHtml(params: { name: string; inviteUrl: string }) {
  const { name, inviteUrl } = params;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#eceff6;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eceff6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background:#f6f8f7;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(54,66,75,0.09);">
          <tr>
            <td style="padding:28px 28px 8px 28px;text-align:center;background:linear-gradient(180deg, ${SAND}33 0%, transparent 100%);">
              <div style="font-size:22px;font-weight:700;letter-spacing:0.12em;color:${NAVY};">NAVIS</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 8px 28px;">
              <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:600;color:#36424b;">Welcome!</h1>
              <p style="margin:0 0 16px 0;font-size:16px;line-height:1.5;color:#5c656d;">
                Hi ${escapeHtml(name)}, you’ve been invited to join the <strong style="color:${NAVY};">Navis</strong> crew.
                Click the button below to accept your invite and set your password.
              </p>
              <p style="margin:24px 0;">
                <a href="${inviteUrl}" style="display:inline-block;padding:14px 28px;background:${NAVY};color:#ffffff;text-decoration:none;border-radius:12px;font-weight:600;font-size:15px;">Accept invite</a>
              </p>
              <p style="margin:16px 0 0 0;font-size:13px;color:#6f7a82;">
                If the button doesn’t work, paste this link into your browser:<br/>
                <a href="${inviteUrl}" style="color:${NAVY};word-break:break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 28px 28px;border-top:1px solid rgba(54,66,75,0.1);">
              <p style="margin:0;font-size:12px;color:#8b7355;">This link expires in 7 days. If you didn’t expect this email, you can ignore it.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Plain-text part improves multipart MIME; some filters prefer it alongside HTML. */
export function buildInviteEmailText(params: { name: string; inviteUrl: string }) {
  const { name, inviteUrl } = params;
  return `Hi ${name},

You've been invited to join Navis. Open this link to accept your invite and set your password:

${inviteUrl}

This link expires in 7 days.

If you didn't expect this message, you can ignore it.
`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseResendErrorBody(status: number, body: string): string {
  try {
    const j = JSON.parse(body) as { message?: string };
    if (typeof j?.message === "string" && j.message.trim()) return j.message.trim();
  } catch {
    /* not JSON */
  }
  const t = body.trim();
  if (t && t.length < 400) return t;
  return `Request failed (HTTP ${status}). Check server logs.`;
}

export function buildTenantWelcomeHtml(params: {
  name: string;
  companyName: string;
  email: string;
  temporaryPassword: string;
  signInUrl: string;
}) {
  const { name, companyName, email, temporaryPassword, signInUrl } = params;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#eceff6;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eceff6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background:#f6f8f7;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(54,66,75,0.09);">
          <tr>
            <td style="padding:28px 28px 8px 28px;text-align:center;background:linear-gradient(180deg, ${SAND}33 0%, transparent 100%);">
              <div style="font-size:22px;font-weight:700;letter-spacing:0.12em;color:${NAVY};">NAVIS</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 8px 28px;">
              <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:600;color:#36424b;">Welcome to Navis</h1>
              <p style="margin:0 0 16px 0;font-size:16px;line-height:1.5;color:#5c656d;">
                Hi ${escapeHtml(name)}, your organization <strong>${escapeHtml(companyName)}</strong> is ready.
                Sign in with the credentials below, then change your password from your profile when you can.
              </p>
              <table role="presentation" style="width:100%;margin:16px 0;background:rgba(30,74,82,0.06);border-radius:12px;border:1px solid rgba(54,66,75,0.12);">
                <tr><td style="padding:14px 16px;font-size:14px;color:#36424b;"><strong>Email</strong><br/><span style="word-break:break-all;">${escapeHtml(email)}</span></td></tr>
                <tr><td style="padding:0 16px 14px 16px;font-size:14px;color:#36424b;"><strong>Temporary password</strong><br/><code style="font-size:15px;background:#fff;padding:4px 8px;border-radius:6px;border:1px solid rgba(54,66,75,0.15);">${escapeHtml(temporaryPassword)}</code></td></tr>
              </table>
              <p style="margin:24px 0;">
                <a href="${signInUrl}" style="display:inline-block;padding:14px 28px;background:${NAVY};color:#ffffff;text-decoration:none;border-radius:12px;font-weight:600;font-size:15px;">Sign in to Navis</a>
              </p>
              <p style="margin:16px 0 0 0;font-size:13px;color:#6f7a82;">
                Or open: <a href="${signInUrl}" style="color:${NAVY};word-break:break-all;">${signInUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 28px 28px;border-top:1px solid rgba(54,66,75,0.1);">
              <p style="margin:0;font-size:12px;color:#8b7355;">Keep this email private. If you didn’t expect it, contact your administrator.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildTenantWelcomeText(params: {
  name: string;
  companyName: string;
  email: string;
  temporaryPassword: string;
  signInUrl: string;
}) {
  return `Hi ${params.name},

Welcome to Navis — your organization "${params.companyName}" is ready.

Sign in here: ${params.signInUrl}

Your login email: ${params.email}
Your temporary password: ${params.temporaryPassword}

Please change your password after you sign in (from your profile) when you can.

— Navis
`;
}

export async function sendTenantWelcomeEmail(params: {
  to: string;
  name: string;
  companyName: string;
  email: string;
  temporaryPassword: string;
}) {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = (process.env.RESEND_FROM || "Navis <onboarding@resend.dev>").trim();
  const signInUrl = `${appBaseUrl()}/signin`;
  const html = buildTenantWelcomeHtml({
    name: params.name,
    companyName: params.companyName,
    email: params.email,
    temporaryPassword: params.temporaryPassword,
    signInUrl,
  });
  const text = buildTenantWelcomeText({
    name: params.name,
    companyName: params.companyName,
    email: params.email,
    temporaryPassword: params.temporaryPassword,
    signInUrl,
  });

  if (!key) {
    console.warn("[mail] RESEND_API_KEY is not set; tenant welcome email not sent.");
    if (process.env.NODE_ENV === "development") {
      console.warn("[mail] Dev-only temporary password for", params.to, ":", params.temporaryPassword);
      return { error: null as null, devSkipped: true as const };
    }
    return {
      error: "Email is not configured (RESEND_API_KEY). Add a key at https://resend.com/api-keys — the organization was still created." as const,
      devSkipped: false as const,
    };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: `Welcome to Navis — sign in (${params.companyName})`,
      text,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[mail] Resend error (tenant welcome):", res.status, body);
    const detail = parseResendErrorBody(res.status, body);
    return { error: `Email not sent: ${detail}` as const, devSkipped: false as const };
  }

  return { error: null as null, devSkipped: false as const };
}

export async function sendInviteEmail(params: { to: string; name: string; inviteToken: string }) {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = (process.env.RESEND_FROM || "Navis <onboarding@resend.dev>").trim();
  const inviteUrl = `${appBaseUrl()}/accept-invite?token=${encodeURIComponent(params.inviteToken)}`;
  const html = buildInviteEmailHtml({ name: params.name, inviteUrl });
  const text = buildInviteEmailText({ name: params.name, inviteUrl });

  if (!key) {
    console.warn("[mail] RESEND_API_KEY is not set; invite email not sent. URL:", inviteUrl);
    // Local dev: still create the user; UI can show the invite link. Production requires a real key.
    if (process.env.NODE_ENV === "development") {
      return { error: null, devInviteUrl: inviteUrl };
    }
    return {
      error:
        "Email is not configured. Add RESEND_API_KEY to .env (get a key at https://resend.com/api-keys).",
    };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: "Welcome to Navis — accept your invite",
      text,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[mail] Resend error:", res.status, text);
    const detail = parseResendErrorBody(res.status, text);
    return {
      error: `Email not sent: ${detail}`,
    };
  }

  let resendEmailId: string | undefined;
  try {
    const j = (await res.json()) as { data?: { id?: string } };
    resendEmailId = typeof j?.data?.id === "string" ? j.data.id : undefined;
  } catch {
    /* empty body */
  }
  if (resendEmailId) {
    console.info("[mail] Resend queued email id:", resendEmailId, "to:", params.to);
  }

  return { error: null, resendEmailId };
}
