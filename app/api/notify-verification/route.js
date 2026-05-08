import { Resend } from 'resend';
import { adminDb } from '../../lib/firebase-admin';
import { verifyToken } from '../../lib/auth-helpers';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'Halalgotos <onboarding@resend.dev>';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sends a "thank you, your submission is in queue" email to the restaurant owner.
 * Called by useOnboarding after addDoc succeeds.
 *
 * POST body: { type: 'submitted', reqId: string }
 * Requires Firebase ID token in Authorization header.
 */
export async function POST(request) {
  try {
    const { uid } = await verifyToken(request);
    if (!uid) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const { type, reqId } = await request.json();

    if (type !== 'submitted') {
      return Response.json({ ok: false, error: 'Invalid type' }, { status: 400 });
    }
    if (!reqId || typeof reqId !== 'string' || reqId.length > 128) {
      return Response.json({ ok: false, error: 'Invalid reqId' }, { status: 400 });
    }

    const reqSnap = await adminDb.collection('verification_requests').doc(reqId).get();
    if (!reqSnap.exists) return Response.json({ ok: false, error: 'Request not found' }, { status: 404 });

    const req = reqSnap.data();
    const ownerEmail = req.userEmail;
    if (!ownerEmail) return Response.json({ ok: true, skipped: true });

    if (!process.env.RESEND_API_KEY) {
      console.log(`[notify-verification] Resend not configured, skipping submitted email to ${ownerEmail}`);
      return Response.json({ ok: true, skipped: true });
    }

    const safeName = escapeHtml(req.businessName || 'your restaurant');
    const safeOwner = escapeHtml((req.userName || '').split(' ')[0] || 'there');

    await resend.emails.send({
      from: FROM,
      to: ownerEmail,
      subject: `We've received your listing request — ${req.businessName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#0a0a0a;color:#e5e5e5;border-radius:12px;">
          <h2 style="color:#22c55e;margin-top:0;">Thank you for signing up with Halalgotos!</h2>
          <p>Hi ${safeOwner},</p>
          <p>We've received your listing request for <strong style="color:#ffffff;">${safeName}</strong> and it's now in our verification queue.</p>
          <p style="background:#111;border:1px solid #222;border-radius:8px;padding:16px;color:#9ca3af;">
            Our team will review your halal certification documents and submitted details within
            <strong style="color:#e5e5e5;">7 business days</strong>. You'll receive another email
            as soon as a decision has been made.
          </p>
          <p>In the meantime, if you have any questions feel free to reach us at
            <a href="mailto:halalgotos@gmail.com" style="color:#22c55e;">halalgotos@gmail.com</a>.
          </p>
          <p style="margin-top:32px;font-size:13px;color:#6b7280;">— The Halalgotos Team</p>
        </div>
      `,
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error('notify-verification error:', err);
    return Response.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
