/**
 * Email notifications via Resend.
 * Set RESEND_API_KEY in Vercel env vars.
 * Stubs to console.log if the key is missing (dev/test mode).
 */

const FROM = process.env.FROM_EMAIL ?? 'HomeFix AI <noreply@excitere.ai>';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://homefix-ai.vercel.app';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return { apiKey: key };
}

async function send(to: string, subject: string, html: string) {
  const resend = getResend();
  if (!resend) {
    console.log(`[HomeFix Email STUB] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resend.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('[HomeFix Email] Resend error:', err);
    }
  } catch (e) {
    console.error('[HomeFix Email] Send failed:', e);
  }
}

// ─── Templates ───────────────────────────────────────────────────────────────

function wrap(body: string) {
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;">
    <div style="margin-bottom:24px;">
      <span style="font-weight:bold;color:#2563eb;font-size:18px;">HomeFix AI</span>
    </div>
    ${body}
    <hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb;" />
    <p style="font-size:12px;color:#6b7280;">HomeFix AI · Powered by AI home repair triage</p>
  </body></html>`;
}

/** Notify all PMs when a new case is submitted. */
export async function emailNewCase(
  pmEmails: string[],
  caseId: string,
  description: string,
  severity: string,
  category: string,
  address?: string
) {
  const isEmergency = severity === 'EMERGENCY';
  const subject = isEmergency
    ? `🚨 EMERGENCY Case — ${category}`
    : `New Case: ${category} · ${severity}`;
  const url = `${BASE_URL}/cases/${caseId}`;
  const html = wrap(`
    <h2 style="margin:0 0 8px;">${isEmergency ? '🚨 Emergency' : 'New'} Case Submitted</h2>
    <p style="color:#6b7280;margin:0 0 16px;">${category} · <strong>${severity}</strong></p>
    ${address ? `<p style="margin:0 0 8px;">📍 ${address}</p>` : ''}
    <p style="background:#f3f4f6;padding:12px;border-radius:8px;font-size:14px;margin:0 0 24px;">${description.slice(0, 300)}${description.length > 300 ? '…' : ''}</p>
    <a href="${url}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
      Review Case →
    </a>
  `);
  for (const email of pmEmails) {
    await send(email, subject, html);
  }
}

/** Notify homeowner when vendor is assigned. */
export async function emailVendorAssigned(
  homeownerEmail: string,
  caseId: string,
  vendorName: string,
  vendorPhone: string,
  category: string
) {
  const url = `${BASE_URL}/cases/${caseId}`;
  const html = wrap(`
    <h2 style="margin:0 0 8px;">Your vendor has been assigned!</h2>
    <p style="color:#6b7280;margin:0 0 16px;">${category} repair</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:0 0 24px;">
      <p style="margin:0 0 4px;font-weight:bold;">${vendorName}</p>
      <p style="margin:0;color:#6b7280;">📞 ${vendorPhone}</p>
    </div>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">They'll reach out to confirm timing. You can track progress below.</p>
    <a href="${url}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
      Track Your Case →
    </a>
  `);
  await send(homeownerEmail, `Vendor assigned for your ${category} repair`, html);
}

/** Notify homeowner when case is marked complete. */
export async function emailCaseCompleted(
  homeownerEmail: string,
  caseId: string,
  category: string,
  invoiceAmount?: number
) {
  const url = `${BASE_URL}/cases/${caseId}`;
  const html = wrap(`
    <h2 style="margin:0 0 8px;">Your repair is complete! ✓</h2>
    <p style="color:#6b7280;margin:0 0 16px;">${category}</p>
    ${invoiceAmount ? `<p style="font-size:24px;font-weight:bold;color:#16a34a;margin:0 0 16px;">$${invoiceAmount.toFixed(2)}</p>` : ''}
    <p style="margin:0 0 24px;font-size:14px;">Please take a moment to rate your experience — it helps us keep our vendors accountable.</p>
    <a href="${url}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
      Leave Feedback →
    </a>
  `);
  await send(homeownerEmail, `Your ${category} repair is complete`, html);
}

/** Send a branded invite to a new homeowner/tenant. */
export async function emailInvite(
  toEmail: string,
  inviteLink: string,
  inviterName?: string
) {
  const html = wrap(`
    <h2 style="margin:0 0 8px;">You're invited to HomeFix AI</h2>
    <p style="color:#6b7280;margin:0 0 16px;">
      ${inviterName ? `<strong>${inviterName}</strong> has invited you` : "You've been invited"} to submit and track maintenance requests online — no more phone tag.
    </p>
    <ul style="font-size:14px;color:#374151;margin:0 0 24px;padding-left:20px;line-height:1.8;">
      <li>Submit issues with photos from your phone</li>
      <li>Get real-time status updates by email</li>
      <li>Know exactly when your vendor is coming</li>
    </ul>
    <a href="${inviteLink}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
      Accept Invitation →
    </a>
    <p style="font-size:12px;color:#9ca3af;margin:16px 0 0;">This link expires in 24 hours. If you didn't expect this, you can safely ignore it.</p>
  `);
  await send(toEmail, 'You\'re invited to HomeFix AI', html);
}
