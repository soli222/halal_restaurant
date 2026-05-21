import Stripe from 'stripe';
import { Resend } from 'resend';
import { verifyToken } from '../../lib/auth-helpers';
import { adminDb, adminAuth } from '../../lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'Halalgotos <onboarding@resend.dev>';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

async function sendCancellationEmail(uid, periodEndIso) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const authUser = await adminAuth.getUser(uid);
    const ownerEmail = authUser.email;
    if (!ownerEmail) return;

    const safeOwner = escapeHtml((authUser.displayName || '').split(' ')[0] || 'there');

    // Best-effort: fetch restaurant name from verification request
    const reqSnap = await adminDb.collection('verification_requests')
      .where('ownerId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    const businessName = reqSnap.empty ? null : reqSnap.docs[0].data().businessName;
    const safeRestaurant = escapeHtml(businessName || 'your restaurant');

    const periodEndFormatted = periodEndIso
      ? new Date(periodEndIso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : null;

    await resend.emails.send({
      from: FROM,
      to: ownerEmail,
      subject: `Your Halalgotos subscription has been cancelled`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#0a0a0a;color:#e5e5e5;border-radius:12px;">
          <h2 style="color:#f87171;margin-top:0;">Subscription cancelled</h2>
          <p>Hi ${safeOwner},</p>
          <p>We've received your cancellation request for <strong style="color:#ffffff;">${safeRestaurant}</strong>.</p>
          ${periodEndFormatted ? `
          <p style="background:#111;border:1px solid #222;border-radius:8px;padding:16px;color:#9ca3af;">
            Your listing will remain <strong style="color:#e5e5e5;">active and visible</strong> to customers until
            <strong style="color:#ffffff;">${periodEndFormatted}</strong>, after which it will be hidden and your subscription will end.
          </p>` : ''}
          <p>If you change your mind, you can resubscribe at any time from your
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://halalgotos.com'}" style="color:#22c55e;">owner dashboard</a>
            and your listing will be restored immediately.
          </p>
          <p>If you have any questions, feel free to reach us at
            <a href="mailto:halalgotos@gmail.com" style="color:#22c55e;">halalgotos@gmail.com</a>.
          </p>
          <p style="margin-top:32px;font-size:13px;color:#6b7280;">— The Halalgotos Team</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('cancel-subscription email error:', err);
  }
}

export async function POST(request) {
  try {
    const { uid } = await verifyToken(request);
    if (!uid) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const subDoc = await adminDb.collection('subscriptions').doc(uid).get();
    if (!subDoc.exists) {
      return Response.json({ error: 'No subscription found' }, { status: 400 });
    }

    const subData = subDoc.data();
    if (!['active', 'trialing'].includes(subData.status)) {
      return Response.json({ error: 'No active subscription to cancel' }, { status: 400 });
    }
    if (subData.cancelAtPeriodEnd) {
      return Response.json({ error: 'Subscription is already scheduled for cancellation' }, { status: 400 });
    }

    const stripeSubscriptionId = subData.stripeSubscriptionId;
    if (!stripeSubscriptionId) {
      return Response.json({ error: 'Subscription record incomplete — contact support' }, { status: 400 });
    }

    // Cancel at period end — customer keeps access until the current billing period ends
    const updated = await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    const periodEndIso = updated.current_period_end
      ? new Date(updated.current_period_end * 1000).toISOString()
      : null;

    // Optimistically write to Firestore — webhook will also fire and confirm
    await adminDb.collection('subscriptions').doc(uid).set({
      cancelAtPeriodEnd: true,
      currentPeriodEnd: periodEndIso,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Fire-and-forget cancellation confirmation email
    sendCancellationEmail(uid, periodEndIso);

    return Response.json({ ok: true, currentPeriodEnd: updated.current_period_end });
  } catch (err) {
    console.error('cancel-subscription error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
