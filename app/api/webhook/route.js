import Stripe from 'stripe';
import { adminDb } from '../../lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated'
  ) {
    const subscription = event.data.object;
    const userId = subscription.metadata?.userId;

    if (userId) {
      const priceId = subscription.items?.data?.[0]?.price?.id;
      const knownPriceIds = [process.env.STRIPE_PRICE_ID, process.env.STRIPE_PRO_PRICE_ID].filter(Boolean);

      if (!priceId || !knownPriceIds.includes(priceId)) {
        console.error('Webhook: unrecognised priceId', priceId, '— skipping subscription write');
        return Response.json({ received: true });
      }

      const plan = priceId === process.env.STRIPE_PRO_PRICE_ID ? 'pro' : 'basic';

      await adminDb.collection('subscriptions').doc(userId).set({
        status: subscription.status,
        plan,
        amount: plan === 'pro' ? 5000 : 3000,
        stripeSubscriptionId: subscription.id,
        cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const userId = subscription.metadata?.userId;

    if (userId) {
      const now = new Date().toISOString();
      await adminDb.collection('subscriptions').doc(userId).set({
        status: 'canceled',
        cancelledAt: now,
        updatedAt: now,
      }, { merge: true });
    }
  }

  return Response.json({ received: true });
}
