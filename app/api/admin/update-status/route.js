import { verifyToken } from '../../../lib/auth-helpers';
import { adminDb } from '../../../lib/firebase-admin';

const ALLOWED_STATUSES = ['approved', 'rejected', 'pending'];

export async function POST(request) {
  try {
    const { uid } = await verifyToken(request);
    if (!uid) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    // Verify admin role server-side — never trust client-side role state
    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    const { reqId, status } = await request.json();

    if (!reqId || typeof reqId !== 'string') {
      return Response.json({ ok: false, error: 'Invalid reqId' }, { status: 400 });
    }
    if (!ALLOWED_STATUSES.includes(status)) {
      return Response.json({ ok: false, error: 'Invalid status' }, { status: 400 });
    }

    await adminDb.collection('verification_requests').doc(reqId).set({ status }, { merge: true });
    return Response.json({ ok: true });
  } catch (err) {
    console.error('admin update-status error:', err);
    return Response.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
