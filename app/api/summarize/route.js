import { verifyToken } from '../../lib/auth-helpers';
import { adminDb } from '../../lib/firebase-admin';

const MAX_REVIEWS_LENGTH = 20000;
const MAX_RESTAURANT_LENGTH = 200;

export async function POST(request) {
  const { uid } = await verifyToken(request);
  if (!uid) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { reviews, restaurant } = body;

  if (!reviews || typeof reviews !== 'string' || !restaurant || typeof restaurant !== 'string') {
    return Response.json({ error: 'Invalid input' }, { status: 400 });
  }

  const safeReviews = reviews.slice(0, MAX_REVIEWS_LENGTH);
  const safeRestaurant = restaurant.slice(0, MAX_RESTAURANT_LENGTH);

  // Determine isPro server-side — never trust the client-supplied value
  let isPro = false;
  try {
    const subDoc = await adminDb.collection('subscriptions').doc(uid).get();
    if (subDoc.exists) {
      const sub = subDoc.data();
      if (['active', 'trialing'].includes(sub.status) && (sub.plan === 'pro' || sub.amount === 3000)) {
        isPro = true;
      }
    }
  } catch (_) {}

  const prompt = isPro
    ? `You are a restaurant analytics expert. Analyze the following customer reviews for "${safeRestaurant}" and provide a structured analysis with exactly these four sections:\n\n1. Overall sentiment score: X/10\n2. Top 3 praised items/aspects (bullet points)\n3. Top 3 complaints/criticisms (bullet points)\n4. One actionable recommendation for the owner (1-2 sentences)\n\nBe specific and data-driven. Use the ratings ([good]/[average]/[bad]) to inform your scoring.\n\nReviews:\n${safeReviews}`
    : `You are a helpful assistant. Summarize the following customer reviews for "${safeRestaurant}" in 2-3 sentences. Mention what customers liked, disliked, and the overall sentiment. Be concise and helpful.\n\nReviews:\n${safeReviews}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: isPro ? 600 : 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json();
  const summary = data.content?.[0]?.text || 'Could not generate summary.';

  return Response.json({ summary });
}
