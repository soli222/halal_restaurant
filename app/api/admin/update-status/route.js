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

    if (!reqId || typeof reqId !== 'string' || reqId.length > 128) {
      return Response.json({ ok: false, error: 'Invalid reqId' }, { status: 400 });
    }
    if (!ALLOWED_STATUSES.includes(status)) {
      return Response.json({ ok: false, error: 'Invalid status' }, { status: 400 });
    }

    await adminDb.collection('verification_requests').doc(reqId).set({ status }, { merge: true });

    // Auto-create restaurant listing on approval (transactional to prevent duplicates)
    if (status === 'approved') {
      const reqSnap = await adminDb.collection('verification_requests').doc(reqId).get();
      const req = reqSnap.data();
      if (req) {
        // ownerId is the actual user ID (from new-style addDoc requests or old-style doc-keyed requests)
        const ownerId = req.ownerId || reqId;
        await adminDb.runTransaction(async (tx) => {
          const existing = await tx.get(
            adminDb.collection('restaurants').where('verificationRequestId', '==', reqId).limit(1)
          );
          if (!existing.empty) return; // Already created — idempotent
          const newRestRef = adminDb.collection('restaurants').doc();
          tx.set(newRestRef, {
            name: req.businessName || '',
            city: req.ownerCity || '',
            cuisine: req.cuisineType || '',
            ownerId,
            verificationRequestId: reqId,
            certifyingBody: req.certifyingBody || null,
            certificationNumber: req.certificationNumber || null,
            certExpiryDate: req.certExpiryDate || null,
            halalCertificateUrl: req.halalCertificateUrl || null,
            businessLicenseUrl: req.businessLicenseUrl || null,
            healthPermitUrl: req.healthPermitUrl || null,
            websiteUrl: req.websiteUrl || null,
            mapsUrl: req.mapsUrl || null,
            coverImageUrl: req.coverImageUrl || null,
            description: req.description || null,
            hours: req.hours || null,
            verified: true,
            createdAt: new Date(),
          });
        });
      }
    }

    // Notify the owner — use ownerId field if available, fall back to reqId for old-style docs
    const reqSnapForNotif = await adminDb.collection('verification_requests').doc(reqId).get();
    const reqDataForNotif = reqSnapForNotif.data();
    const notifTargetUid = reqDataForNotif?.ownerId || reqId;

    const notifMessage =
      status === 'approved'
        ? 'Your restaurant verification has been approved! Your listing is now live.'
        : status === 'rejected'
        ? 'Your restaurant verification was not approved. Please contact support@halalspot.com for more info.'
        : null;
    if (notifMessage) {
      adminDb
        .collection('notifications')
        .doc(notifTargetUid)
        .collection('items')
        .add({
          type: status === 'approved' ? 'verification_approved' : 'verification_rejected',
          message: notifMessage,
          read: false,
          createdAt: new Date(),
        })
        .catch(() => {});
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('admin update-status error:', err);
    return Response.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
