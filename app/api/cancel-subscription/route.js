import Stripe from 'stripe';
import { verifyToken } from '../../lib/auth-helpers';
import { adminDb } from '../../lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

    // Optimistically write to Firestore — webhook will also fire and confirm
    await adminDb.collection('subscriptions').doc(uid).set({
      cancelAtPeriodEnd: true,
      currentPeriodEnd: updated.current_period_end
        ? new Date(updated.current_period_end * 1000).toISOString()
        : null,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return Response.json({ ok: true, currentPeriodEnd: updated.current_period_end });
  } catch (err) {
    console.error('cancel-subscription error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
