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
      return Response.json({ error: 'No active subscription' }, { status: 400 });
    }
    if (subData.plan === 'pro') {
      return Response.json({ error: 'Already on Pro plan' }, { status: 400 });
    }

    const stripeSubscriptionId = subData.stripeSubscriptionId;
    if (!stripeSubscriptionId) {
      return Response.json({ error: 'Subscription record incomplete — contact support' }, { status: 400 });
    }

    // Retrieve from Stripe to get the subscription item ID
    const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const itemId = stripeSub.items.data[0]?.id;
    if (!itemId) {
      return Response.json({ error: 'Could not find subscription item' }, { status: 400 });
    }

    // Switch to Pro price with no proration — customer pays the Pro rate at next renewal,
    // no extra charge today. Stripe fires customer.subscription.updated which updates Firestore.
    await stripe.subscriptions.update(stripeSubscriptionId, {
      items: [{ id: itemId, price: process.env.STRIPE_PRO_PRICE_ID }],
      proration_behavior: 'none',
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error('upgrade-subscription error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
