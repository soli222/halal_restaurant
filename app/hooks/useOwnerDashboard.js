import { useState } from 'react';
import { db, storage } from '../lib/firebase';
import {
  doc, getDoc, setDoc, updateDoc, getDocs,
  collection, query, where, orderBy, limit,
  serverTimestamp,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { DEFAULT_HOURS } from '../constants';

function computeAnalyticsStats(items, reviewCount) {
  const now = new Date();
  const msPerDay = 86400000;
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfThisWeek = new Date(now - now.getDay() * msPerDay);
  startOfThisWeek.setHours(0, 0, 0, 0);
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Build last-14-days map
  const dayMap = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * msPerDay);
    d.setHours(0, 0, 0, 0);
    dayMap[d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })] = 0;
  }

  let total = items.length;
  let today = 0, thisWeek = 0, thisMonth = 0, authenticated = 0;

  items.forEach(item => {
    const d = item.viewedAt?.toDate?.();
    if (!d) return;
    if (d >= startOfToday) today++;
    if (d >= startOfThisWeek) thisWeek++;
    if (d >= startOfThisMonth) thisMonth++;
    if (item.isAuthenticated) authenticated++;
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (key in dayMap) dayMap[key]++;
  });

  const days = Object.entries(dayMap).map(([label, count]) => ({ label, count }));
  const conversionRate = total > 0 ? ((reviewCount / total) * 100).toFixed(1) : '0.0';
  const signedInRate = total > 0 ? Math.round((authenticated / total) * 100) : 0;

  return { total, today, thisWeek, thisMonth, days, conversionRate, signedInRate };
}

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
  const [analyticsStats, setAnalyticsStats] = useState(null);

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
          let reviewCount = 0;
          try {
            const revSnap = await getDocs(
              query(
                collection(db, 'reviews'),
                where('restaurantId', '==', rest.id),
                orderBy('createdAt', 'desc'),
                limit(5)
              )
            );
            const revDocs = revSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setDashboardReviews(revDocs);
            // Fetch total review count for conversion rate
            const allRevSnap = await getDocs(
              query(collection(db, 'reviews'), where('restaurantId', '==', rest.id))
            );
            reviewCount = allRevSnap.size;
          } catch {
            // Composite index may not exist yet — skip reviews silently
          }

          // Fetch analytics for this restaurant
          try {
            const analyticsSnap = await getDocs(
              query(
                collection(db, 'analytics'),
                where('restaurantId', '==', rest.id),
                limit(2000)
              )
            );
            const items = analyticsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setAnalyticsStats(computeAnalyticsStats(items, reviewCount));
          } catch {
            // Analytics collection may not exist yet
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
    analyticsStats,
  };
}
