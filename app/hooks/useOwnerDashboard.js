import { useState } from 'react';
import { db, storage } from '../lib/firebase';
import {
  doc, getDoc, setDoc, updateDoc, getDocs,
  collection, query, where, orderBy, limit,
  serverTimestamp,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { DEFAULT_HOURS } from '../constants';

export function useOwnerDashboard(showToast) {
  const [uid, setUid] = useState(null);
  const [verificationRequest, setVerificationRequest] = useState(null);
  const [linkedRestaurant, setLinkedRestaurant] = useState(null);
  const [dashboardReviews, setDashboardReviews] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Editable fields — seeded from verificationRequest when data loads
  const [editDescription, setEditDescription] = useState('');
  const [editHours, setEditHours] = useState(DEFAULT_HOURS);
  const [editWebsiteUrl, setEditWebsiteUrl] = useState('');
  const [editMapsUrl, setEditMapsUrl] = useState('');
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');

  async function fetchDashboardData(userId) {
    setUid(userId);
    setLoadingDashboard(true);
    try {
      const snap = await getDoc(doc(db, 'verification_requests', userId));
      if (snap.exists()) {
        const data = snap.data();
        setVerificationRequest(data);
        setEditDescription(data.description || '');
        setEditHours(data.hours || DEFAULT_HOURS);
        setEditWebsiteUrl(data.websiteUrl || '');
        setEditMapsUrl(data.mapsUrl || '');
        if (data.coverImageUrl) setCoverImagePreview(data.coverImageUrl);

        // Find the linked restaurant: ownerId query first, name match as fallback
        let rest = null;
        const byOwner = await getDocs(
          query(collection(db, 'restaurants'), where('ownerId', '==', userId), limit(1))
        );
        if (!byOwner.empty) {
          rest = { id: byOwner.docs[0].id, ...byOwner.docs[0].data() };
        } else if (data.businessName) {
          const byName = await getDocs(
            query(collection(db, 'restaurants'), where('name', '==', data.businessName), limit(1))
          );
          if (!byName.empty) rest = { id: byName.docs[0].id, ...byName.docs[0].data() };
        }
        setLinkedRestaurant(rest);

        if (rest) {
          try {
            const revSnap = await getDocs(
              query(
                collection(db, 'reviews'),
                where('restaurantId', '==', rest.id),
                orderBy('createdAt', 'desc'),
                limit(5)
              )
            );
            setDashboardReviews(revSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          } catch {
            // Composite index may not exist yet — skip reviews silently
          }
        }
      } else {
        setVerificationRequest(null);
      }
    } catch {
      showToast('Failed to load dashboard.', 'error');
    } finally {
      setLoadingDashboard(false);
    }
  }

  async function saveProfile() {
    if (!uid) return;
    setSavingProfile(true);
    try {
      let coverImageUrl = verificationRequest?.coverImageUrl || null;
      if (coverImageFile) {
        const r = storageRef(storage, `owner_covers/${uid}/${Date.now()}_${coverImageFile.name}`);
        await uploadBytes(r, coverImageFile);
        coverImageUrl = await getDownloadURL(r);
        setCoverImageFile(null);
      }

      const updates = {
        description: editDescription.trim() || null,
        hours: editHours,
        websiteUrl: editWebsiteUrl.trim() || null,
        mapsUrl: editMapsUrl.trim() || null,
        updatedAt: serverTimestamp(),
        ...(coverImageUrl !== verificationRequest?.coverImageUrl ? { coverImageUrl } : {}),
      };

      await setDoc(doc(db, 'verification_requests', uid), updates, { merge: true });
      setVerificationRequest(prev => ({ ...prev, ...updates }));
      if (coverImageUrl && coverImageUrl !== verificationRequest?.coverImageUrl) {
        setCoverImagePreview(coverImageUrl);
      }

      // Mirror editable fields to the public restaurant listing if linked
      if (linkedRestaurant) {
        const restUpdates = {
          hours: editHours,
          websiteUrl: editWebsiteUrl.trim() || null,
          mapsUrl: editMapsUrl.trim() || null,
          ...(coverImageUrl !== verificationRequest?.coverImageUrl ? { coverImageUrl } : {}),
        };
        await updateDoc(doc(db, 'restaurants', linkedRestaurant.id), restUpdates);
        setLinkedRestaurant(prev => ({ ...prev, ...restUpdates }));
      }

      showToast('Profile saved!');
    } catch {
      showToast('Failed to save profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  }

  function handleCoverChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Please upload an image.', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB.', 'error'); return; }
    setCoverImageFile(file);
    setCoverImagePreview(URL.createObjectURL(file));
  }

  return {
    verificationRequest, linkedRestaurant, dashboardReviews,
    loadingDashboard, savingProfile,
    editDescription, setEditDescription,
    editHours, setEditHours,
    editWebsiteUrl, setEditWebsiteUrl,
    editMapsUrl, setEditMapsUrl,
    coverImageFile, coverImagePreview,
    handleCoverChange,
    fetchDashboardData, saveProfile,
  };
}
