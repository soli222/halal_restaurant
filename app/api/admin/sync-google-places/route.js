import { verifyToken } from '../../../lib/auth-helpers';
import { adminDb } from '../../../lib/firebase-admin';
import { fetchGooglePlacesData } from '../../../lib/google-places';

export async function POST(request) {
  try {
    const { uid } = await verifyToken(request);
    if (!uid) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    const { reqId } = await request.json();
    if (!reqId || typeof reqId !== 'string' || reqId.length > 128) {
      return Response.json({ ok: false, error: 'Invalid reqId' }, { status: 400 });
    }

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return Response.json({ ok: false, error: 'GOOGLE_PLACES_API_KEY not configured' }, { status: 503 });
    }

    // Find the restaurant linked to this verification request
    const restSnap = await adminDb.collection('restaurants')
      .where('verificationRequestId', '==', reqId)
      .limit(1)
      .get();

    if (restSnap.empty) {
      return Response.json({ ok: false, error: 'No restaurant found for this request' }, { status: 404 });
    }

    const restDoc = restSnap.docs[0];
    const rest = restDoc.data();

    const placesData = await fetchGooglePlacesData(
      rest.name,
      [rest.streetAddress, rest.city, rest.state].filter(Boolean).join(', ')
    );

    if (!placesData) {
      return Response.json({ ok: false, error: 'Restaurant not found on Google Places' }, { status: 404 });
    }

    const update = { googlePlaceId: placesData.placeId };
    const updated = [];

    if (placesData.phone) {
      update.phone = placesData.phone;
      updated.push('phone');
    }
    if (placesData.hours) {
      update.hours = placesData.hours;
      updated.push('hours');
    }

    await restDoc.ref.update(update);

    return Response.json({
      ok: true,
      message: updated.length
        ? `Updated: ${updated.join(' & ')}`
        : 'Found on Google but no phone or hours data available',
    });
  } catch (err) {
    console.error('sync-google-places error:', err);
    return Response.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
