import { adminAuth } from './firebase-admin';

/**
 * Verifies the Firebase ID token from the Authorization: Bearer <token> header.
 * Returns { uid } on success, or { uid: null } if missing/invalid.
 */
export async function verifyToken(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return { uid: null };
    const token = authHeader.slice(7);
    const decoded = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid };
  } catch {
    return { uid: null };
  }
}
