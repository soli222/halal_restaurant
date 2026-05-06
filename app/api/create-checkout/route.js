import Stripe from 'stripe';
import { verifyToken } from '../../lib/auth-helpers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const ALLOWED_PLANS = ['basic', 'pro'];

export async function POST(request) {
  try {
    const { uid } = await verifyToken(request);
    if (!uid) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { userId, email, plan } = await request.json();

    // Ensure the checkout is being created for the authenticated user only
    if (userId !== uid) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!ALLOWED_PLANS.includes(plan)) {
      return Response.json({ error: 'Invalid plan' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return Response.json({ error: 'Invalid email' }, { status: 400 });
    }

    const priceId = plan === 'pro'
      ? process.env.STRIPE_PRO_PRICE_ID
      : process.env.STRIPE_PRICE_ID;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { userId },
      },
      metadata: { userId },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?subscribed=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error('create-checkout error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
