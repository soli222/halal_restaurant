import { verifyToken } from '../../../lib/auth-helpers';
import { adminDb } from '../../../lib/firebase-admin';
import { Resend } from 'resend';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://halalgotos.com';
const FROM = process.env.RESEND_FROM_EMAIL || 'Halalgotos <onboarding@resend.dev>';

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

async function sendVerificationEmail(status, req) {
  if (!process.env.RESEND_API_KEY) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const ownerEmail = req.userEmail;
  if (!ownerEmail) return;
  const safeName = escapeHtml(req.businessName || 'your restaurant');
  const safeOwner = escapeHtml((req.userName || '').split(' ')[0] || 'there');

  if (status === 'approved') {
    await resend.emails.send({
      from: FROM,
      to: ownerEmail,
      subject: `🎉 Your restaurant is live on Halalgotos — ${req.businessName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#0a0a0a;color:#e5e5e5;border-radius:12px;">
          <h2 style="color:#22c55e;margin-top:0;">Your restaurant has been approved!</h2>
          <p>Hi ${safeOwner},</p>
          <p>Great news — <strong style="color:#ffffff;">${safeName}</strong> has been verified and your listing is now <strong style="color:#22c55e;">live on Halalgotos</strong> for customers to discover.</p>
          <p style="background:#111;border:1px solid #1a3a1a;border-radius:8px;padding:16px;color:#9ca3af;">
            Customers can now find your restaurant, read your profile, and leave reviews. Log in to your owner dashboard to update your hours, cover photo, and other details at any time.
          </p>
          <p style="margin:24px 0;">
            <a href="${APP_URL}" style="display:inline-block;background:#22c55e;color:#000;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;">Go to my dashboard →</a>
          </p>
          <p>If you have any questions, contact us at <a href="mailto:halalgotos@gmail.com" style="color:#22c55e;">halalgotos@gmail.com</a>.</p>
          <p style="margin-top:32px;font-size:13px;color:#6b7280;">— The Halalgotos Team</p>
        </div>
      `,
    });
  } else if (status === 'rejected') {
    await resend.emails.send({
      from: FROM,
      to: ownerEmail,
      subject: `Update on your Halalgotos listing request — ${req.businessName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#0a0a0a;color:#e5e5e5;border-radius:12px;">
          <h2 style="color:#ef4444;margin-top:0;">Your listing request was not approved</h2>
          <p>Hi ${safeOwner},</p>
          <p>Unfortunately, we were unable to approve the listing request for <strong style="color:#ffffff;">${safeName}</strong> at this time.</p>
          <p style="background:#111;border:1px solid #3a1a1a;border-radius:8px;padding:16px;color:#9ca3af;">
            This is usually due to one of the following reasons:
            <ul style="margin:12px 0 0;padding-left:20px;">
              <li>The halal certificate could not be verified or has expired</li>
              <li>The submitted documents were incomplete or unclear</li>
              <li>The certifying body could not be confirmed</li>
            </ul>
          </p>
          <p>Our team will reach out to you at this email address with more specific details and next steps. You're welcome to re-submit once the issue has been resolved.</p>
          <p>If you have any questions, contact us at <a href="mailto:halalgotos@gmail.com" style="color:#22c55e;">halalgotos@gmail.com</a>.</p>
          <p style="margin-top:32px;font-size:13px;color:#6b7280;">— The Halalgotos Team</p>
        </div>
      `,
    });
  }
}

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
            streetAddress: req.streetAddress || null,
            city: req.ownerCity || '',
            state: req.state || null,
            zip: req.zip || null,
            location: [req.streetAddress, req.ownerCity, req.state].filter(Boolean).join(', ') || null,
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
        ? 'Your restaurant verification was not approved. Please contact support@halalgotos.com for more info.'
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

    // Send approval/rejection email to owner (fire-and-forget)
    if (status === 'approved' || status === 'rejected') {
      sendVerificationEmail(status, reqDataForNotif || {}).catch(() => {});
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('admin update-status error:', err);
    return Response.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
