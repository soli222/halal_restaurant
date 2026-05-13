import { useState } from 'react';
import { db, storage } from '../lib/firebase';
import { moderateImage } from '../lib/moderate-image';
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

export function useOwnerDashboard(showToast, user) {
  const [uid, setUid] = useState(null);
  const [allVerificationRequests, setAllVerificationRequests] = useState([]);
  const [allLinkedRestaurants, setAllLinkedRestaurants] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [verificationRequest, setVerificationRequest] = useState(null);
  const [linkedRestaurant, setLinkedRestaurant] = useState(null);
  const [dashboardReviews, setDashboardReviews] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Editable fields — seeded from active verificationRequest when data loads
  const [editDescription, setEditDescription] = useState('');
  const [editHours, setEditHours] = useState(DEFAULT_HOURS);
  const [editWebsiteUrl, setEditWebsiteUrl] = useState('');
  const [editMapsUrl, setEditMapsUrl] = useState('');
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [moderatingCover, setModeratingCover] = useState(false);
  const [analyticsStats, setAnalyticsStats] = useState(null);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Load reviews + analytics for the given restaurant and update state
  async function loadRestaurantData(rest) {
    if (!rest) {
      setDashboardReviews([]);
      setAnalyticsStats(null);
      return;
    }
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
      setDashboardReviews(revSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const allRevSnap = await getDocs(
        query(collection(db, 'reviews'), where('restaurantId', '==', rest.id))
      );
      reviewCount = allRevSnap.size;
    } catch {
      // Composite index may not exist yet — skip reviews silently
    }
    try {
      const analyticsSnap = await getDocs(
        query(
          collection(db, 'analytics'),
          where('restaurantId', '==', rest.id),
          limit(2000)
        )
      );
      setAnalyticsStats(computeAnalyticsStats(
        analyticsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        reviewCount
      ));
    } catch {
      // Analytics collection may not exist yet
    }
  }

  // Seed editable fields from a verification request doc
  function seedEditFields(req) {
    setVerificationRequest(req);
    setEditDescription(req.description || '');
    setEditHours(req.hours || DEFAULT_HOURS);
    setEditWebsiteUrl(req.websiteUrl || '');
    setEditMapsUrl(req.mapsUrl || '');
    setCoverImagePreview(req.coverImageUrl || '');
    setCoverImageFile(null);
  }

  async function fetchDashboardData(userId) {
    setUid(userId);
    setLoadingDashboard(true);
    try {
      // New-style: verification_requests have an ownerId field (addDoc-based)
      let reqs = [];
      const newStyleSnap = await getDocs(
        query(collection(db, 'verification_requests'), where('ownerId', '==', userId))
      );
      reqs = newStyleSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Backward compat: old-style doc keyed by userId (setDoc-based)
      if (reqs.length === 0) {
        const oldStyleSnap = await getDoc(doc(db, 'verification_requests', userId));
        if (oldStyleSnap.exists()) {
          reqs = [{ id: userId, ...oldStyleSnap.data() }];
        }
      }

      setAllVerificationRequests(reqs);

      if (reqs.length === 0) {
        setVerificationRequest(null);
        setLinkedRestaurant(null);
        setAllLinkedRestaurants([]);
        setDashboardReviews([]);
        setAnalyticsStats(null);
        return;
      }

      // Get all restaurants belonging to this owner
      const restsSnap = await getDocs(
        query(collection(db, 'restaurants'), where('ownerId', '==', userId), limit(20))
      );
      const allRests = restsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Match each verification request to its restaurant
      const matched = reqs.map(req => {
        // New style: linked via verificationRequestId
        let rest = allRests.find(r => r.verificationRequestId === req.id);
        // Fallback for old-style or name-only matching
        if (!rest && req.businessName) {
          rest = allRests.find(r => r.name === req.businessName);
        }
        return rest || null;
      });
      setAllLinkedRestaurants(matched);

      // Activate the first request
      setActiveIndex(0);
      seedEditFields(reqs[0]);
      setLinkedRestaurant(matched[0]);
      setGalleryPhotos(matched[0]?.galleryPhotos || []);
      await loadRestaurantData(matched[0]);

    } catch {
      showToast('Failed to load dashboard.', 'error');
    } finally {
      setLoadingDashboard(false);
    }
  }

  async function switchRestaurant(index) {
    if (index < 0 || index >= allVerificationRequests.length) return;
    setActiveIndex(index);
    const req = allVerificationRequests[index];
    const rest = allLinkedRestaurants[index];
    seedEditFields(req);
    setLinkedRestaurant(rest);
    setGalleryPhotos(rest?.galleryPhotos || []);
    await loadRestaurantData(rest);
  }

  async function saveProfile() {
    if (!uid || !verificationRequest) return;
    setSavingProfile(true);
    try {
      let coverImageUrl = verificationRequest.coverImageUrl || null;
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
        ...(coverImageUrl !== verificationRequest.coverImageUrl ? { coverImageUrl } : {}),
      };

      // Use the document ID from the verificationRequest object (works for both old and new style)
      await setDoc(doc(db, 'verification_requests', verificationRequest.id), updates, { merge: true });
      const updatedReq = { ...verificationRequest, ...updates };
      setVerificationRequest(updatedReq);

      // Keep allVerificationRequests in sync
      setAllVerificationRequests(prev =>
        prev.map(r => r.id === verificationRequest.id ? updatedReq : r)
      );

      if (coverImageUrl && coverImageUrl !== verificationRequest.coverImageUrl) {
        setCoverImagePreview(coverImageUrl);
      }

      // Mirror editable fields to the public restaurant listing if linked
      if (linkedRestaurant) {
        const restUpdates = {
          hours: editHours,
          websiteUrl: editWebsiteUrl.trim() || null,
          mapsUrl: editMapsUrl.trim() || null,
          ...(coverImageUrl !== verificationRequest.coverImageUrl ? { coverImageUrl } : {}),
        };
        await updateDoc(doc(db, 'restaurants', linkedRestaurant.id), restUpdates);
        const updatedRest = { ...linkedRestaurant, ...restUpdates };
        setLinkedRestaurant(updatedRest);
        setAllLinkedRestaurants(prev =>
          prev.map(r => r?.id === linkedRestaurant.id ? updatedRest : r)
        );
      }

      showToast('Profile saved!');
    } catch {
      showToast('Failed to save profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleCoverChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Please upload an image.', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB.', 'error'); return; }

    setModeratingCover(true);
    try {
      const token = await user.getIdToken();
      const { safe, reason } = await moderateImage(file, token);
      if (!safe) {
        showToast(
          reason
            ? `Image rejected: ${reason}. Please upload an appropriate restaurant photo.`
            : 'This image isn\'t allowed on Halalgotos. Please upload an appropriate restaurant photo.',
          'error'
        );
        return;
      }
    } finally {
      setModeratingCover(false);
    }

    setCoverImageFile(file);
    setCoverImagePreview(URL.createObjectURL(file));
  }

  async function handleGalleryAdd(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    if (!file.type.startsWith('image/')) { showToast('Please upload an image file.', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB.', 'error'); return; }
    if (galleryPhotos.length >= 7) { showToast('Maximum 7 photos allowed.', 'error'); return; }

    const restId = linkedRestaurant?.id;
    if (!restId) return;

    setUploadingGallery(true);
    try {
      const token = await user.getIdToken();
      const { safe, reason } = await moderateImage(file, token);
      if (!safe) {
        showToast(reason ? `Image rejected: ${reason}.` : 'This image isn\'t allowed on Halalgotos.', 'error');
        return;
      }
      const r = storageRef(storage, `restaurant_gallery/${restId}/${Date.now()}_${file.name}`);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      const newPhotos = [...galleryPhotos, url];
      await updateDoc(doc(db, 'restaurants', restId), { galleryPhotos: newPhotos });
      setGalleryPhotos(newPhotos);
      showToast('Photo added to gallery!');
    } catch {
      showToast('Failed to upload photo.', 'error');
    } finally {
      setUploadingGallery(false);
    }
  }

  async function handleGalleryRemove(url) {
    const restId = linkedRestaurant?.id;
    if (!restId) return;
    const newPhotos = galleryPhotos.filter(p => p !== url);
    try {
      await updateDoc(doc(db, 'restaurants', restId), { galleryPhotos: newPhotos });
      setGalleryPhotos(newPhotos);
      showToast('Photo removed.');
    } catch {
      showToast('Failed to remove photo.', 'error');
    }
  }

  return {
    allVerificationRequests, allLinkedRestaurants, activeIndex,
    verificationRequest, linkedRestaurant, dashboardReviews,
    loadingDashboard, savingProfile,
    editDescription, setEditDescription,
    editHours, setEditHours,
    editWebsiteUrl, setEditWebsiteUrl,
    editMapsUrl, setEditMapsUrl,
    coverImageFile, coverImagePreview, moderatingCover,
    handleCoverChange,
    galleryPhotos, uploadingGallery, handleGalleryAdd, handleGalleryRemove,
    fetchDashboardData, saveProfile, switchRestaurant,
    analyticsStats,
  };
}
