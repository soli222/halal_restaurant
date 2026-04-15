import { Resend } from 'resend';
import { adminDb } from '../../lib/firebase-admin';

const resend = new Resend(process.env.RESEND_API_KEY);

const RATING_LABELS = {
  recommended: 'Highly Recommended',
  good: 'Good',
  average: 'Average',
  not_recommended: 'Not Recommended',
};

export async function POST(request) {
  try {
    const { restaurantId, rating, reviewText } = await request.json();
    if (!restaurantId) return Response.json({ ok: false, error: 'Missing restaurantId' });

    const restDoc = await adminDb.collection('restaurants').doc(restaurantId).get();
    if (!restDoc.exists) return Response.json({ ok: false, error: 'Restaurant not found' });

    const restData = restDoc.data();
    let ownerEmail = restData.ownerEmail || null;

    if (!ownerEmail && restData.ownerId) {
      const vDoc = await adminDb.collection('verification_requests').doc(restData.ownerId).get();
      if (vDoc.exists) ownerEmail = vDoc.data().userEmail || null;
    }

    if (!ownerEmail) return Response.json({ ok: true, skipped: true });

    const ratingLabel = RATING_LABELS[rating] || rating;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'HalalSpot <onboarding@resend.dev>',
      to: ownerEmail,
      subject: `New review for ${restData.name} on HalalSpot`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0a0a0a;color:#e5e5e5;border-radius:12px;">
          <h2 style="color:#22c55e;margin-top:0;">New Review on HalalSpot</h2>
          <p>You have a new review on HalalSpot! A customer rated your restaurant as <strong style="color:#22c55e;">${ratingLabel}</strong> and left this comment:</p>
          <blockquote style="border-left:3px solid #22c55e;padding:12px 16px;background:#111;border-radius:0 8px 8px 0;margin:16px 0;color:#d1d5db;">
            "${reviewText}"
          </blockquote>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://halalspot.app'}" style="display:inline-block;background:#22c55e;color:#000;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;">Log in to HalalSpot to reply</a></p>
        </div>
      `,
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error('notify-owner error:', err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
