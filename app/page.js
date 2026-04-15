'use client';
import { useState, useEffect, useRef } from 'react';
import { Poppins } from 'next/font/google';
import { auth, db, storage, googleProvider } from './lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import {
  collection, addDoc, getDocs, query, orderBy, serverTimestamp, where, doc, getDoc, setDoc, updateDoc, deleteDoc
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

const RATING_OPTIONS = [
  { value: 'recommended', label: '✅ Highly Recommended' },
  { value: 'good', label: '👍 Good' },
  { value: 'average', label: '😐 Average' },
  { value: 'not_recommended', label: '👎 Not Recommended' },
];

const RATING_STYLES = {
  recommended: {
    pill: 'bg-green-500/15 text-green-400 border border-green-500/25',
    leftBorder: 'border-l-green-500',
    selected: 'bg-green-500 text-white shadow-lg shadow-green-500/20',
    bar: 'bg-green-500',
  },
  good: {
    pill: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
    leftBorder: 'border-l-emerald-400',
    selected: 'bg-emerald-400 text-white shadow-lg shadow-emerald-400/20',
    bar: 'bg-emerald-400',
  },
  average: {
    pill: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25',
    leftBorder: 'border-l-yellow-500',
    selected: 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20',
    bar: 'bg-yellow-500',
  },
  not_recommended: {
    pill: 'bg-red-500/15 text-red-400 border border-red-500/25',
    leftBorder: 'border-l-red-500',
    selected: 'bg-red-500 text-white shadow-lg shadow-red-500/20',
    bar: 'bg-red-500',
  },
};

const CERTIFYING_BODIES = ['ISNA', 'IFANCA', 'HFA', 'MAS', 'Local Mosque', 'Other'];

const CUISINES = ['All', 'Pakistani', 'Mediterranean', 'BBQ', 'American Halal', 'Indian', 'Persian', 'Middle Eastern', 'Lebanese', 'Afghan', 'Indonesian', 'Ethiopian', 'Burgers'];

const CUISINE_IMAGES = {
  'Pakistani':      'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&h=300&fit=crop&q=80',
  'Indian':         'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop&q=80',
  'Mediterranean':  'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&q=80',
  'BBQ':            'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&h=300&fit=crop&q=80',
  'American Halal': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&q=80',
  'Afghan':         'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop&q=80',
  'Persian':        'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop&q=80',
  'Middle Eastern': 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&h=300&fit=crop&q=80',
  'Lebanese':       'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=400&h=300&fit=crop&q=80',
  'Indonesian':     'https://images.unsplash.com/photo-1555243896-c709bfa0b564?w=400&h=300&fit=crop&q=80',
  'Ethiopian':      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop&q=80',
  'Burgers':        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&q=80',
  'Turkish':        'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop&q=80',
};
const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop&q=80';

const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

const DEFAULT_HOURS = Object.fromEntries(
  DAYS.map(d => [d.key, { open: '11:00', close: '22:00', closed: false }])
);

function getOpenStatus(hours) {
  if (!hours) return null;
  const now = new Date();
  const dayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
  const today = hours[dayKey];
  if (!today || today.closed) return { status: 'closed', label: 'Closed today' };
  const [openH, openM] = today.open.split(':').map(Number);
  const [closeH, closeM] = today.close.split(':').map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;
  if (nowMins < openMins) return { status: 'closed', label: `Opens at ${formatTime(today.open)}` };
  if (nowMins >= closeMins) return { status: 'closed', label: `Closed · opens tomorrow` };
  const minsLeft = closeMins - nowMins;
  if (minsLeft <= 60) return { status: 'closing', label: `Closes in ${minsLeft}m` };
  return { status: 'open', label: `Open · closes ${formatTime(today.close)}` };
}

function formatTime(t) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, '0')}${ampm}`;
}

function certExpiryStatus(expiryDate) {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysLeft = Math.floor((expiry - now) / 86400000);
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 30) return 'expiring';
  return 'valid';
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loadingSub, setLoadingSub] = useState(false);
  const [search, setSearch] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState('recommended');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [advancedSummary, setAdvancedSummary] = useState('');
  const [loadingAdvanced, setLoadingAdvanced] = useState(false);
  const [addingRestaurant, setAddingRestaurant] = useState(false);
  const [newRestName, setNewRestName] = useState('');
  const [newRestLocation, setNewRestLocation] = useState('');
  const [newCertNumber, setNewCertNumber] = useState('');
  const [view, setView] = useState('home');
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [cuisineFilter, setCuisineFilter] = useState('All');
  const [toasts, setToasts] = useState([]);
  const [showAllCuisines, setShowAllCuisines] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported] = useState(() => typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window));
  const recognitionRef = useRef(null);

  const [favourites, setFavourites] = useState(new Set());
  const [reviewStats, setReviewStats] = useState({});
  const [cityFilter, setCityFilter] = useState('All Cities');
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Review quick questions
  const [certVisible, setCertVisible] = useState(null);
  const [familyFriendly, setFamilyFriendly] = useState(null);

  // Owner reply state
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Open Now filter
  const [openNowFilter, setOpenNowFilter] = useState(false);

  // Verification form state
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState(null);
  const [hoursInput, setHoursInput] = useState(DEFAULT_HOURS);

  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [verifyFiles, setVerifyFiles] = useState([]);
  const [businessLicenseFile, setBusinessLicenseFile] = useState(null);
  const [healthPermitFile, setHealthPermitFile] = useState(null);
  const [halalCertFile, setHalalCertFile] = useState(null);
  const [certifyingBody, setCertifyingBody] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [certExpiry, setCertExpiry] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [confirmOwnership, setConfirmOwnership] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifySubmitted, setVerifySubmitted] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        fetchSubscription(u.uid);
        fetchUserRole(u.uid);
        fetchFavourites(u.uid);
      } else {
        setSubscription(null);
        setUserRole(null);
        setFavourites(new Set());
      }
    });
    return unsub;
  }, []);

  useEffect(() => { fetchRestaurants(); fetchAllReviewStats(); }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowInstallBanner(true), 30000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function fetchUserRole(userId) {
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists() && snap.data().role) {
        setUserRole(snap.data().role);
      } else {
        setUserRole(null);
      }
    } catch (e) { setUserRole(null); }
  }

  async function handleRoleSelect(role) {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid), { role }, { merge: true });
    setUserRole(role);
  }

  async function fetchSubscription(userId) {
    setLoadingSub(true);
    try {
      const snap = await getDoc(doc(db, 'subscriptions', userId));
      setSubscription(snap.exists() ? snap.data() : null);
    } catch (e) { setSubscription(null); }
    setLoadingSub(false);
  }

  function isSubscribed() {
    if (!subscription) return false;
    return ['active', 'trialing'].includes(subscription.status);
  }

  function isPro() {
    if (!subscription) return false;
    return subscription.plan === 'pro' || subscription.amount === 3000;
  }

  async function handleSubscribe(plan) {
    if (!user) return handleLogin();
    setLoadingSub(true);
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, email: user.email, plan }),
      });
      const data = await res.json();
      window.location.href = data.url;
    } catch (e) { showToast('Something went wrong. Please try again.', 'error'); }
    setLoadingSub(false);
  }

  function handleShowPricing() {
    if (!user) return handleLogin();
    setView('pricing');
  }

  function showToast(message, type = 'success') {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }

  async function fetchRestaurants() {
    setLoadingRestaurants(true);
    try {
      const q = query(collection(db, 'restaurants'), orderBy('name'));
      const snap = await getDocs(q);
      setRestaurants(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { showToast('Failed to load restaurants', 'error'); }
    setLoadingRestaurants(false);
  }

  async function fetchReviews(restaurantId) {
    const q = query(
      collection(db, 'reviews'),
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function fetchFavourites(userId) {
    try {
      const snap = await getDocs(collection(db, 'favourites', userId, 'restaurants'));
      setFavourites(new Set(snap.docs.map(d => d.id)));
    } catch (e) { setFavourites(new Set()); }
  }

  async function toggleFavourite(e, restaurantId) {
    e.stopPropagation();
    if (!user) return handleLogin();
    const ref = doc(db, 'favourites', user.uid, 'restaurants', restaurantId);
    if (favourites.has(restaurantId)) {
      await deleteDoc(ref);
      setFavourites(prev => { const n = new Set(prev); n.delete(restaurantId); return n; });
    } else {
      await setDoc(ref, { savedAt: serverTimestamp() });
      setFavourites(prev => new Set([...prev, restaurantId]));
    }
  }

  async function fetchAllReviewStats() {
    try {
      const snap = await getDocs(collection(db, 'reviews'));
      const stats = {};
      snap.docs.forEach(d => {
        const { restaurantId, rating } = d.data();
        if (!restaurantId) return;
        if (!stats[restaurantId]) stats[restaurantId] = { count: 0, totalScore: 0 };
        stats[restaurantId].count++;
        const score = { recommended: 5, good: 4, average: 3, not_recommended: 1 }[rating] || 3;
        stats[restaurantId].totalScore += score;
      });
      Object.keys(stats).forEach(id => {
        stats[id].avg = Math.round((stats[id].totalScore / stats[id].count) * 10) / 10;
      });
      setReviewStats(stats);
    } catch (e) {}
  }

  async function shareRestaurant() {
    const url = `${window.location.origin}/review/${selected.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: selected.name, text: `Check out ${selected.name} on HalalSpot!`, url });
      } catch (e) {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        showToast('Link copied!');
      } catch (e) {
        showToast('Could not copy link', 'error');
      }
    }
  }

  async function openRestaurant(rest) {
    setSelected(rest);
    setView('restaurant');
    setAiSummary('');
    setAdvancedSummary('');
    const r = await fetchReviews(rest.id);
    setReviews(r);
  }

  async function handleLogin() {
    try { await signInWithPopup(auth, googleProvider); }
    catch (e) { showToast('Sign in failed. Please try again.', 'error'); }
  }

  async function handleLogout() {
    await signOut(auth);
  }

  function toggleListening() {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join(' ');
      setReviewText(prev => prev ? prev + ' ' + transcript : transcript);
    };
    recognition.onerror = () => { setIsListening(false); };
    recognition.onend = () => { setIsListening(false); };
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function submitReview() {
    if (!reviewText.trim()) return showToast('Please write a review before submitting.', 'error');
    setSubmitting(true);
    try {
      let photoUrl = null;
      if (photo) {
        const ext = photo.name.split('.').pop() || 'jpg';
        const photoRef = storageRef(storage, `review_photos/${selected.id}/${user.uid}_${Date.now()}.${ext}`);
        await uploadBytes(photoRef, photo);
        photoUrl = await getDownloadURL(photoRef);
      }
      await addDoc(collection(db, 'reviews'), {
        restaurantId: selected.id,
        restaurantName: selected.name,
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        text: reviewText,
        rating,
        certVisible: certVisible,
        familyFriendly: familyFriendly,
        photoUrl,
        createdAt: serverTimestamp(),
      });
      setReviewText('');
      setRating('recommended');
      setCertVisible(null);
      setFamilyFriendly(null);
      setPhoto(null);
      setPhotoPreview(null);
      showToast('Review posted!');
      const _score = { recommended: 5, good: 4, average: 3, not_recommended: 1 }[rating] || 3;
      setReviewStats(prev => {
        const current = prev[selected.id] || { count: 0, totalScore: 0 };
        const newCount = current.count + 1;
        const newTotal = current.totalScore + _score;
        return { ...prev, [selected.id]: { count: newCount, totalScore: newTotal, avg: Math.round((newTotal / newCount) * 10) / 10 } };
      });
      fetch('/api/notify-owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: selected.id, rating, reviewText }),
      }).catch(() => {});
      const r = await fetchReviews(selected.id);
      setReviews(r);
    } catch (e) {
      showToast('Failed to post review. Please try again.', 'error');
    }
    setSubmitting(false);
  }

  async function submitReply(reviewId) {
    if (!replyText.trim()) return showToast('Please write a reply before posting.', 'error');
    setSubmittingReply(true);
    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        reply: {
          text: replyText,
          userId: user.uid,
          userName: user.displayName,
          userPhoto: user.photoURL,
          createdAt: new Date().toISOString(),
        },
      });
      setReviews(prev => prev.map(r => r.id === reviewId
        ? { ...r, reply: { text: replyText, userId: user.uid, userName: user.displayName, userPhoto: user.photoURL, createdAt: new Date().toISOString() } }
        : r
      ));
      setReplyText('');
      setReplyingTo(null);
      showToast('Reply posted!');
    } catch (e) {
      showToast('Failed to post reply. Please try again.', 'error');
    }
    setSubmittingReply(false);
  }

  async function generateSummary() {
    if (reviews.length === 0) return showToast('No reviews to summarize yet.', 'error');
    setLoadingSummary(true);
    const reviewsText = reviews.map(r => `[${r.rating}] ${r.text}`).join('\n');
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews: reviewsText, restaurant: selected.name, isPro: false }),
      });
      const data = await res.json();
      setAiSummary(data.summary);
    } catch (e) {
      setAiSummary('Could not generate summary.');
    }
    setLoadingSummary(false);
  }

  async function generateAdvancedSummary() {
    if (reviews.length === 0) return showToast('No reviews to analyze yet.', 'error');
    setLoadingAdvanced(true);
    const reviewsText = reviews.map(r => `[${r.rating}] ${r.text}`).join('\n');
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews: reviewsText, restaurant: selected.name, isPro: true }),
      });
      const data = await res.json();
      setAdvancedSummary(data.summary);
    } catch (e) {
      setAdvancedSummary('Could not generate advanced insights.');
    }
    setLoadingAdvanced(false);
  }

  async function addRestaurant() {
    if (!newRestName.trim() || !newRestLocation.trim()) return showToast('Please fill in restaurant name and location.', 'error');
    const docRef = await addDoc(collection(db, 'restaurants'), {
      name: newRestName.trim(),
      location: newRestLocation.trim(),
      certificationNumber: newCertNumber.trim() || null,
      hours: hoursInput,
      createdAt: serverTimestamp(),
    });
    if (coverPhotoFile) {
      try {
        const r = storageRef(storage, `restaurant_covers/${docRef.id}/${coverPhotoFile.name}`);
        await uploadBytes(r, coverPhotoFile);
        const coverImageUrl = await getDownloadURL(r);
        await updateDoc(doc(db, 'restaurants', docRef.id), { coverImageUrl });
      } catch (_) {}
    }
    setNewRestName('');
    setNewRestLocation('');
    setNewCertNumber('');
    setCoverPhotoFile(null);
    setCoverPhotoPreview(null);
    setHoursInput(DEFAULT_HOURS);
    setAddingRestaurant(false);
    showToast('Restaurant added successfully!');
    fetchRestaurants();
  }

  function handleVerifyFiles(e) {
    const selected = Array.from(e.target.files);
    const MAX_SIZE = 5 * 1024 * 1024;
    const allowed = selected.filter(f => f.type.startsWith('image/') || f.type === 'application/pdf');
    if (allowed.length !== selected.length) {
      setVerifyError('Only JPG, PNG, and PDF files are accepted.');
      return;
    }
    const oversized = allowed.find(f => f.size > MAX_SIZE);
    if (oversized) {
      setVerifyError(`"${oversized.name}" exceeds the 5MB limit.`);
      return;
    }
    setVerifyError('');
    setVerifyFiles(allowed.slice(0, 5));
  }

  function handleSingleFile(e, setter) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setVerifyError('Only JPG, PNG, and PDF files are accepted.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setVerifyError(`"${file.name}" exceeds the 5MB limit.`);
      return;
    }
    setVerifyError('');
    setter(file);
  }

  async function submitVerification() {
    setVerifyError('');
    const imageFiles = verifyFiles.filter(f => f.type.startsWith('image/'));
    const pdfFiles = verifyFiles.filter(f => f.type === 'application/pdf');
    if (pdfFiles.length === 0 && imageFiles.length < 2) {
      setVerifyError('Upload at least one PDF or at least two images as proof.');
      return;
    }
    if (!businessLicenseFile) {
      setVerifyError('Business License is required.');
      return;
    }
    if (!healthPermitFile) {
      setVerifyError('Health Permit / Food Safety Certificate is required.');
      return;
    }
    if (!halalCertFile) {
      setVerifyError('Halal Certification Certificate is required.');
      return;
    }
    if (!certifyingBody) {
      setVerifyError('Please select a certifying body.');
      return;
    }
    if (!certNumber.trim()) {
      setVerifyError('Certification Number is required.');
      return;
    }
    if (!certExpiry) {
      setVerifyError('Certificate Expiry Date is required.');
      return;
    }
    if (!confirmOwnership) {
      setVerifyError('You must confirm ownership before submitting.');
      return;
    }
    setVerifyLoading(true);
    try {
      const proofUrls = [];
      for (const file of verifyFiles) {
        const r = storageRef(storage, `verification_proofs/${user.uid}/${file.name}`);
        await uploadBytes(r, file);
        proofUrls.push(await getDownloadURL(r));
      }
      const blRef = storageRef(storage, `verification_proofs/${user.uid}/business_license/${businessLicenseFile.name}`);
      await uploadBytes(blRef, businessLicenseFile);
      const businessLicenseUrl = await getDownloadURL(blRef);

      const hpRef = storageRef(storage, `verification_proofs/${user.uid}/health_permit/${healthPermitFile.name}`);
      await uploadBytes(hpRef, healthPermitFile);
      const healthPermitUrl = await getDownloadURL(hpRef);

      const hcRef = storageRef(storage, `verification_proofs/${user.uid}/halal_certificate/${halalCertFile.name}`);
      await uploadBytes(hcRef, halalCertFile);
      const halalCertificateUrl = await getDownloadURL(hcRef);

      await setDoc(doc(db, 'verification_requests', user.uid), {
        userId: user.uid,
        userName: user.displayName || '',
        userEmail: user.email || '',
        proofs: proofUrls,
        businessLicenseUrl,
        healthPermitUrl,
        halalCertificateUrl,
        certifyingBody,
        certificationNumber: certNumber.trim(),
        certExpiryDate: certExpiry,
        websiteUrl: websiteUrl.trim() || null,
        mapsUrl: mapsUrl.trim() || null,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setVerifySubmitted(true);
      setShowVerifyForm(false);
      showToast('Verification submitted! We\'ll review it shortly.');
      setVerifyFiles([]);
      setBusinessLicenseFile(null);
      setHealthPermitFile(null);
      setHalalCertFile(null);
      setCertifyingBody('');
      setCertNumber('');
      setCertExpiry('');
      setWebsiteUrl('');
      setMapsUrl('');
      setConfirmOwnership(false);
    } catch (e) {
      setVerifyError('Upload failed. Please try again.');
      showToast('Upload failed. Please try again.', 'error');
    }
    setVerifyLoading(false);
  }

  const filtered = restaurants.filter(r => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || r.name?.toLowerCase().includes(q) || r.location?.toLowerCase().includes(q) || r.cuisine?.toLowerCase().includes(q);
    const matchesCuisine = cuisineFilter === 'All' || (cuisineFilter === 'Favourites' ? favourites.has(r.id) : r.cuisine?.toLowerCase().includes(cuisineFilter.toLowerCase()));
    const matchesCity = cityFilter === 'All Cities' || r.city === cityFilter || r.location?.includes(cityFilter);
    const matchesOpen = !openNowFilter || ['open', 'closing'].includes(getOpenStatus(r.hours)?.status);
    return matchesSearch && matchesCuisine && matchesCity && matchesOpen;
  });

  const cities = [...new Set(restaurants.map(r => r.city || r.location?.split(',')[0]?.trim()).filter(Boolean))].sort();

  const topRated = restaurants
    .filter(r => reviewStats[r.id]?.count >= 3)
    .map(r => ({ ...r, avg: reviewStats[r.id].avg, count: reviewStats[r.id].count }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  function getAvatarStyle(letter) {
    const styles = [
      'bg-green-500/20 text-green-400',
      'bg-emerald-500/20 text-emerald-400',
      'bg-teal-500/20 text-teal-400',
      'bg-green-600/20 text-green-500',
      'bg-emerald-400/20 text-emerald-300',
    ];
    return styles[(letter?.charCodeAt(0) || 0) % styles.length];
  }

  const ratingCount = (val) => reviews.filter(r => r.rating === val).length;

  function getAnalytics() {
    const total = reviews.length;
    const recommended = ratingCount('recommended');
    const good = ratingCount('good');
    const average = ratingCount('average');
    const not_recommended = ratingCount('not_recommended');

    const now = new Date();
    const msPerDay = 86400000;
    const startOfThisWeek = new Date(now - now.getDay() * msPerDay);
    startOfThisWeek.setHours(0, 0, 0, 0);
    const startOfLastWeek = new Date(startOfThisWeek - 7 * msPerDay);

    let thisWeek = 0;
    let lastWeek = 0;
    reviews.forEach(r => {
      const d = r.createdAt?.toDate?.();
      if (!d) return;
      if (d >= startOfThisWeek) thisWeek++;
      else if (d >= startOfLastWeek) lastWeek++;
    });

    // Daily counts for last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now - i * msPerDay);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + msPerDay);
      const count = reviews.filter(r => {
        const d = r.createdAt?.toDate?.();
        return d && d >= dayStart && d < dayEnd;
      }).length;
      days.push({ label: dayStart.toLocaleDateString('en-US', { weekday: 'short' }), count });
    }

    return { total, recommended, good, average, not_recommended, thisWeek, lastWeek, days };
  }

  // ─── ROLE SELECTION ───────────────────────────────────────────────────────
  if (user && userRole === null) {
    return (
      <div className={`${poppins.className} min-h-screen bg-[#0A0A0A] text-gray-100 flex flex-col items-center justify-center px-4`}>
        <div className="w-full max-w-sm space-y-6 text-center">
          <div>
            <span className="text-4xl">☪️</span>
            <h2 className="text-2xl font-bold text-white mt-3">Welcome to HalalSpot</h2>
            <p className="text-gray-500 text-sm mt-2">How are you planning to use HalalSpot?</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleRoleSelect('customer')}
              className="bg-[#111111] border border-white/10 hover:border-green-500/50 rounded-2xl p-5 flex flex-col items-center gap-3 transition-all duration-200 hover:-translate-y-0.5"
            >
              <span className="text-3xl">🍽️</span>
              <span className="text-sm font-semibold text-white">I'm a Customer</span>
              <span className="text-xs text-gray-500">Discover & review restaurants</span>
            </button>
            <button
              onClick={() => handleRoleSelect('owner')}
              className="bg-[#111111] border border-white/10 hover:border-green-500/50 rounded-2xl p-5 flex flex-col items-center gap-3 transition-all duration-200 hover:-translate-y-0.5"
            >
              <span className="text-3xl">🏪</span>
              <span className="text-sm font-semibold text-white">I'm a Restaurant Owner</span>
              <span className="text-xs text-gray-500">Manage your restaurant</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── PRICING VIEW ─────────────────────────────────────────────────────────
  if (view === 'pricing') {
    return (
      <div className={`${poppins.className} min-h-screen bg-[#0A0A0A] text-gray-100`}>
        <header className="bg-[#111111] border-b border-white/5 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <button
            onClick={() => setView('home')}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <span className="font-semibold text-white">Choose a plan</span>
          <div className="w-16" />
        </header>

        <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Start your free 7-day trial</h2>
            <p className="text-gray-500 text-sm mt-2">No charge until your trial ends. Cancel anytime.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Basic card */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
              <div>
                <p className="text-sm font-medium text-gray-400">Basic</p>
                <p className="mt-1">
                  <span className="text-3xl font-bold text-white">$20</span>
                  <span className="text-gray-500 text-sm">/mo</span>
                </p>
              </div>
              <ul className="space-y-2.5 flex-1">
                {[
                  'Leave & reply to reviews',
                  'Good / Average / Bad ratings',
                  'Basic AI summary',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe('basic')}
                disabled={loadingSub}
                className="w-full bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingSub ? 'Redirecting...' : 'Start free trial'}
              </button>
            </div>

            {/* Pro card */}
            <div className="bg-[#111111] border-2 border-green-500/60 rounded-2xl p-6 flex flex-col gap-4 relative shadow-[0_0_32px_rgba(34,197,94,0.1)]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-full">Most popular</span>
              </div>
              <div>
                <p className="text-sm font-medium text-green-400">Pro</p>
                <p className="mt-1">
                  <span className="text-3xl font-bold text-white">$30</span>
                  <span className="text-gray-500 text-sm">/mo</span>
                </p>
              </div>
              <ul className="space-y-2.5 flex-1">
                {[
                  'Everything in Basic',
                  'Advanced AI insights',
                  'Analytics dashboard',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe('pro')}
                disabled={loadingSub}
                className="w-full bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/20"
              >
                {loadingSub ? 'Redirecting...' : 'Start free trial'}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── RESTAURANT DETAIL VIEW ───────────────────────────────────────────────
  if (view === 'restaurant' && selected) {
    const analytics = isSubscribed() ? getAnalytics() : null;
    const maxDayCount = analytics ? Math.max(...analytics.days.map(d => d.count), 1) : 1;

    return (
      <div className={`${poppins.className} min-h-screen bg-[#0A0A0A] text-gray-100`}>

        {/* Toast notifications */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
          {toasts.map(t => (
            <div
              key={t.id}
              className={`px-5 py-3 rounded-2xl text-sm font-medium shadow-xl backdrop-blur-sm pointer-events-auto ${
                t.type === 'error'
                  ? 'bg-red-500/90 text-white'
                  : 'bg-[#1a1a1a] text-green-400 border border-green-500/20'
              }`}
            >
              {t.type === 'error' ? '⚠ ' : '✓ '}{t.message}
            </div>
          ))}
        </div>

        {/* Header */}
        <header className="bg-[#111111] border-b border-white/5 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <button
            onClick={() => setView('home')}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <span className="font-semibold text-white truncate max-w-[160px]">{selected.name}</span>
          {user ? (
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white transition-all duration-200"
            >
              Sign out
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="text-sm font-medium text-green-400 hover:text-green-300 transition-all duration-200"
            >
              Sign in
            </button>
          )}
        </header>

        {/* Restaurant hero banner */}
        <div className="relative overflow-hidden" style={{ minHeight: '220px' }}>
          {selected.coverImageUrl ? (
            <img src={selected.coverImageUrl} alt={selected.name} className="w-full h-56 object-cover" />
          ) : (
            <div className="w-full h-56 bg-gradient-to-br from-green-950/70 via-[#091409] to-[#0A0A0A] flex items-center justify-center overflow-hidden">
              <span className="text-[140px] font-black text-green-500/10 select-none leading-none">
                {selected.name?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent" />
          {/* Cert badge overlay */}
          <div className="absolute top-4 right-4">
            {(() => {
              const status = certExpiryStatus(selected.certExpiryDate);
              if (status === 'expired') return (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500/80 text-white">⚠ Cert Expired</span>
              );
              if (status === 'expiring') return (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-yellow-500/80 text-black">⚠ Expiring Soon</span>
              );
              return (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-500 text-white">✓ Halal Certified</span>
              );
            })()}
          </div>
          {/* Restaurant info over gradient */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-5">
            <div className="flex items-end justify-between gap-2">
            <h1 className="text-2xl font-extrabold text-white leading-tight">{selected.name}</h1>
            <button
              onClick={shareRestaurant}
              className="flex-shrink-0 p-2 rounded-xl bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all duration-200 mb-0.5"
              title="Share restaurant"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-gray-400 text-sm flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {selected.location}
              </span>
              {selected.cuisine && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/25">{selected.cuisine}</span>
              )}
              {selected.certifyingBody && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300 border border-white/15">{selected.certifyingBody}</span>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

          {/* Community stats + rating counts */}
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 space-y-4">
            {/* Halal cert detail line */}
            {(selected.certificationNumber || selected.certExpiryDate) && (
              <div className="flex flex-wrap gap-2">
                {selected.certificationNumber && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10">
                    #{selected.certificationNumber}
                  </span>
                )}
                {selected.certExpiryDate && (() => {
                  const status = certExpiryStatus(selected.certExpiryDate);
                  const colorClass = status === 'expired'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : status === 'expiring'
                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    : 'bg-green-500/10 text-green-400 border-green-500/20';
                  return (
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${colorClass}`}>
                      Expires {new Date(selected.certExpiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  );
                })()}
              </div>
            )}
            {/* Community stats */}
            {reviews.length > 0 && (() => {
              const cvCount = reviews.filter(r => r.certVisible === true).length;
              const cvTotal = reviews.filter(r => r.certVisible !== null && r.certVisible !== undefined).length;
              const ffCount = reviews.filter(r => r.familyFriendly === true).length;
              const ffTotal = reviews.filter(r => r.familyFriendly !== null && r.familyFriendly !== undefined).length;
              return (cvTotal > 0 || ffTotal > 0) ? (
                <div className="flex flex-wrap gap-2">
                  {cvTotal > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/15">
                      🏷 Cert visible: {Math.round((cvCount / cvTotal) * 100)}%
                    </span>
                  )}
                  {ffTotal > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/15">
                      👨‍👩‍👧 Family-friendly: {Math.round((ffCount / ffTotal) * 100)}%
                    </span>
                  )}
                </div>
              ) : null;
            })()}
            {/* Rating counts */}
            <div className="flex flex-wrap gap-2">
              {RATING_OPTIONS.map(opt => (
                <span
                  key={opt.value}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${RATING_STYLES[opt.value].pill}`}
                >
                  {opt.label}
                  <span className="font-bold">{ratingCount(opt.value)}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Business hours */}
          {selected.hours && (
            <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Hours
                </h2>
                {(() => {
                  const s = getOpenStatus(selected.hours);
                  if (!s) return null;
                  const styles = {
                    open:    'bg-green-500/15 text-green-400 border-green-500/25',
                    closing: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
                    closed:  'bg-white/5 text-gray-500 border-white/10',
                  };
                  return (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${styles[s.status]}`}>
                      {s.label}
                    </span>
                  );
                })()}
              </div>
              <div className="space-y-2">
                {(() => {
                  const todayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
                  return DAYS.map(({ key, label }) => {
                    const day = selected.hours[key];
                    const isToday = key === todayKey;
                    return (
                      <div key={key} className={`flex items-center justify-between py-1.5 ${isToday ? 'text-white' : 'text-gray-500'}`}>
                        <span className={`text-xs font-medium w-8 ${isToday ? 'text-green-400' : ''}`}>{label}</span>
                        {!day || day.closed ? (
                          <span className="text-xs text-gray-600">Closed</span>
                        ) : (
                          <span className="text-xs">{formatTime(day.open)} – {formatTime(day.close)}</span>
                        )}
                        {isToday && <div className="w-1.5 h-1.5 rounded-full bg-green-500 ml-2 flex-shrink-0" />}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Analytics dashboard — Pro subscribers */}
          {isSubscribed() && (
            <div className="relative">
              {isPro() ? (
                <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 space-y-5">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Analytics
                    <span className="ml-auto text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full border border-green-500/25">Pro</span>
                  </h2>

                  {/* Total count */}
                  <div className="flex items-center justify-between bg-[#1A1A1A] rounded-xl px-4 py-3">
                    <span className="text-sm text-gray-400">Total reviews</span>
                    <span className="text-2xl font-bold text-white">{analytics.total}</span>
                  </div>

                  {/* Rating breakdown */}
                  <div className="space-y-2.5">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rating breakdown</p>
                    {RATING_OPTIONS.map(opt => {
                      const count = analytics[opt.value];
                      const pct = analytics.total > 0 ? (count / analytics.total) * 100 : 0;
                      return (
                        <div key={opt.value} className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-20 flex-shrink-0">{opt.label}</span>
                          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${RATING_STYLES[opt.value].bar} transition-all duration-500`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-6 text-right flex-shrink-0">{count}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Weekly trend */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Weekly trend</p>
                      <p className="text-xs text-gray-500">
                        This week: <span className="text-white font-medium">{analytics.thisWeek}</span>
                        <span className="mx-1.5 text-gray-700">·</span>
                        Last week: <span className="text-white font-medium">{analytics.lastWeek}</span>
                      </p>
                    </div>
                    <div className="flex items-end gap-1 h-12">
                      {analytics.days.map((day, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex items-end justify-center" style={{ height: '40px' }}>
                            <div
                              className="w-full rounded-t bg-green-500/40 hover:bg-green-500/70 transition-colors duration-200"
                              style={{ height: `${(day.count / maxDayCount) * 40}px`, minHeight: day.count > 0 ? '3px' : '0' }}
                              title={`${day.label}: ${day.count}`}
                            />
                          </div>
                          <span className="text-[10px] text-gray-600">{day.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Basic subscriber — blurred analytics overlay */
                <div className="relative rounded-2xl overflow-hidden">
                  <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 space-y-5 select-none pointer-events-none" style={{ filter: 'blur(4px)' }}>
                    <h2 className="text-sm font-semibold text-white">Analytics</h2>
                    <div className="flex items-center justify-between bg-[#1A1A1A] rounded-xl px-4 py-3">
                      <span className="text-sm text-gray-400">Total reviews</span>
                      <span className="text-2xl font-bold text-white">—</span>
                    </div>
                    <div className="space-y-2.5">
                      {RATING_OPTIONS.map(opt => (
                        <div key={opt.value} className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-20">{opt.label}</span>
                          <div className="flex-1 h-2 bg-white/5 rounded-full" />
                          <span className="text-xs text-gray-500 w-6">0</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0A0A]/60 rounded-2xl p-6 text-center">
                    <div className="w-10 h-10 bg-green-500/15 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <p className="text-white font-semibold text-sm mb-1">Analytics is a Pro feature</p>
                    <p className="text-gray-500 text-xs mb-4">Upgrade to unlock rating breakdowns and weekly trends.</p>
                    <button
                      onClick={() => setView('pricing')}
                      className="bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-green-500/20"
                    >
                      Upgrade to Pro — $30/mo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Basic AI Summary */}
          <div className="bg-[#111111] rounded-2xl p-5 border border-green-500/20 shadow-[0_0_24px_rgba(34,197,94,0.06)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-green-400 flex items-center gap-2">
                ✨ AI Summary
              </span>
              <button
                onClick={generateSummary}
                disabled={loadingSummary}
                className="text-xs bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold px-4 py-1.5 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingSummary ? 'Generating...' : 'Generate'}
              </button>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {aiSummary || 'Click Generate to get an AI-powered summary of all reviews for this restaurant.'}
            </p>
          </div>

          {/* Advanced AI Insights — Pro subscribers */}
          {isSubscribed() && (
            <div className="relative">
              {isPro() ? (
                <div className="bg-[#111111] rounded-2xl p-5 border border-green-500/30 shadow-[0_0_24px_rgba(34,197,94,0.08)]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-green-400 flex items-center gap-2">
                      🔬 Advanced AI Insights
                      <span className="text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full border border-green-500/25">Pro</span>
                    </span>
                    <button
                      onClick={generateAdvancedSummary}
                      disabled={loadingAdvanced}
                      className="text-xs bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold px-4 py-1.5 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingAdvanced ? 'Analyzing...' : 'Analyze'}
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                    {advancedSummary || 'Click Analyze for a detailed breakdown: sentiment score, top praised items, complaints, and a recommendation.'}
                  </p>
                </div>
              ) : (
                /* Basic subscriber — blurred advanced insights overlay */
                <div className="relative rounded-2xl overflow-hidden">
                  <div className="bg-[#111111] rounded-2xl p-5 border border-green-500/20 space-y-2 select-none pointer-events-none" style={{ filter: 'blur(4px)' }}>
                    <span className="text-sm font-semibold text-green-400">🔬 Advanced AI Insights</span>
                    <p className="text-gray-400 text-sm">Sentiment score: —/10</p>
                    <p className="text-gray-600 text-xs">Top praised: ████████ ██████ ████</p>
                    <p className="text-gray-600 text-xs">Top complaints: ██████ ████████</p>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0A0A]/60 rounded-2xl p-6 text-center">
                    <div className="w-10 h-10 bg-green-500/15 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <p className="text-white font-semibold text-sm mb-1">Advanced AI Insights is a Pro feature</p>
                    <p className="text-gray-500 text-xs mb-4">Get sentiment scores, top praised items, complaints, and actionable recommendations.</p>
                    <button
                      onClick={() => setView('pricing')}
                      className="bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-green-500/20"
                    >
                      Upgrade to Pro — $30/mo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Leave a review */}
          {user ? (
            <div className="bg-[#111111] rounded-2xl p-5 border border-white/5 space-y-4">
              <h2 className="font-semibold text-white">Leave a review</h2>
              <div className="flex gap-2">
                {RATING_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setRating(opt.value)}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      rating === opt.value
                        ? RATING_STYLES[opt.value].selected
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="Share your experience..."
                  rows={3}
                  className="w-full bg-[#1A1A1A] rounded-xl px-4 py-3 pr-12 text-sm text-gray-100 placeholder-gray-600 border border-white/10 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 resize-none transition-all duration-200"
                />
                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleListening}
                    title={isListening ? 'Stop listening' : 'Dictate your review'}
                    className={`absolute right-2.5 top-2.5 p-1.5 rounded-lg transition-all duration-200 ${
                      isListening
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'text-gray-500 hover:text-green-400 hover:bg-white/5'
                    }`}
                  >
                    {isListening ? (
                      <span className="flex items-center gap-1 text-xs font-medium px-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                        Listening
                      </span>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    )}
                  </button>
                )}
              </div>

              {/* Quick questions */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">Was the halal certification visible at the restaurant?</p>
                  <div className="flex gap-2">
                    {[true, false].map(val => (
                      <button
                        key={String(val)}
                        onClick={() => setCertVisible(val)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                          certVisible === val
                            ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                            : 'bg-white/5 text-gray-500 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {val ? 'Yes' : 'No'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">Would you bring your family here?</p>
                  <div className="flex gap-2">
                    {[true, false].map(val => (
                      <button
                        key={String(val)}
                        onClick={() => setFamilyFriendly(val)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                          familyFriendly === val
                            ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                            : 'bg-white/5 text-gray-500 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {val ? 'Yes' : 'No'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer hover:text-green-400 transition-all duration-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {photoPreview ? 'Photo added ✓' : 'Add photo (optional)'}
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
                <button
                  onClick={submitReview}
                  disabled={submitting}
                  className="bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Posting...' : 'Post Review'}
                </button>
              </div>
              {photoPreview && (
                <img src={photoPreview} alt="preview" className="h-28 rounded-xl object-cover border border-white/10" />
              )}
            </div>
          ) : (
            <div className="bg-[#111111] rounded-2xl p-8 border border-white/5 text-center">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm mb-4">Sign in to share your experience</p>
              <button
                onClick={handleLogin}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all duration-200"
              >
                Sign in with Google
              </button>
            </div>
          )}

          {/* Reviews list */}
          <div className="space-y-3">
            <h2 className="font-semibold text-white text-lg">Reviews ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <div className="bg-[#111111] border border-white/5 rounded-2xl p-12 text-center">
                <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-gray-400 font-medium">No reviews yet</p>
                <p className="text-gray-600 text-sm mt-1">Be the first from the community to review this place!</p>
              </div>
            ) : (
              reviews.map(r => {
                const opt = RATING_OPTIONS.find(o => o.value === r.rating);
                const rStyle = RATING_STYLES[r.rating] || RATING_STYLES.good;
                return (
                  <div
                    key={r.id}
                    className={`bg-[#141414] rounded-2xl p-4 border border-white/5 border-l-[3px] ${rStyle.leftBorder} transition-all duration-200`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5">
                        {r.userPhoto ? (
                          <img src={r.userPhoto} alt="" className="w-9 h-9 rounded-full ring-2 ring-white/10 flex-shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold ring-2 ring-white/10 flex-shrink-0">
                            {r.userName?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-medium text-white">{r.userName}</span>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${rStyle.pill}`}>{opt?.label}</span>
                      </div>
                      {r.createdAt && (
                        <span className="text-xs text-gray-600 flex-shrink-0">
                          {r.createdAt?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed pl-10">{r.text}</p>
                    {r.photoUrl && (
                      <img src={r.photoUrl} alt="Review photo" className="mt-2 ml-10 rounded-xl object-cover border border-white/10 max-h-48 w-auto max-w-[calc(100%-2.5rem)]" />
                    )}
                    {(r.certVisible !== null && r.certVisible !== undefined) || (r.familyFriendly !== null && r.familyFriendly !== undefined) ? (
                      <div className="flex flex-wrap gap-1.5 mt-2 pl-10">
                        {r.certVisible !== null && r.certVisible !== undefined && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${r.certVisible ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                            {r.certVisible ? '🏷 Cert visible' : '🏷 Cert not visible'}
                          </span>
                        )}
                        {r.familyFriendly !== null && r.familyFriendly !== undefined && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${r.familyFriendly ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                            {r.familyFriendly ? '👨‍👩‍👧 Family-friendly' : '👨‍👩‍👧 Not family-friendly'}
                          </span>
                        )}
                      </div>
                    ) : null}
                    {r.reply && (
                      <div className="mt-3 ml-10 bg-[#1a1a1a] border-l-2 border-green-500/40 rounded-xl p-3 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25">🏪 Owner reply</span>
                          <span className="text-xs text-gray-500">{r.reply.userName}</span>
                        </div>
                        <p className="text-gray-300 text-xs leading-relaxed">{r.reply.text}</p>
                      </div>
                    )}
                    {userRole === 'owner' && !r.reply && replyingTo !== r.id && (
                      <div className="mt-2 pl-10">
                        <button
                          onClick={() => { setReplyingTo(r.id); setReplyText(''); }}
                          className="text-xs text-green-400/70 hover:text-green-400 transition-colors duration-200"
                        >
                          Reply
                        </button>
                      </div>
                    )}
                    {replyingTo === r.id && (
                      <div className="mt-3 ml-10 space-y-2">
                        <textarea
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          placeholder="Write your reply..."
                          rows={2}
                          className="w-full bg-[#1A1A1A] rounded-xl px-3 py-2 text-xs text-gray-100 placeholder-gray-600 border border-white/10 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 resize-none transition-all duration-200"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => submitReply(r.id)}
                            disabled={submittingReply}
                            className="bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {submittingReply ? 'Posting...' : 'Post'}
                          </button>
                          <button
                            onClick={() => { setReplyingTo(null); setReplyText(''); }}
                            disabled={submittingReply}
                            className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── HOME VIEW ────────────────────────────────────────────────────────────
  return (
    <div className={`${poppins.className} min-h-screen bg-[#080808] text-gray-100 relative overflow-x-hidden`}>
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)' }} />
      </div>

      {/* Toast notifications */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-5 py-3 rounded-2xl text-sm font-medium shadow-xl backdrop-blur-sm transition-all duration-300 pointer-events-auto ${
              t.type === 'error'
                ? 'bg-red-500/90 text-white'
                : 'bg-[#1a1a1a] text-green-400 border border-green-500/20'
            }`}
          >
            {t.type === 'error' ? '⚠ ' : '✓ '}{t.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="bg-[#111111]/90 backdrop-blur-sm border-b border-white/5 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-[680px] mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-white flex items-center gap-2 relative">
            <span className="absolute -inset-2 rounded-xl blur-xl bg-green-500/10 -z-10" />
            <span>☪️</span>
            <span>HalalSpot</span>
          </h1>
          {user ? (
            <div className="flex items-center gap-3">
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full ring-2 ring-white/10" />
              <button
                onClick={handleLogout}
                className="text-sm text-gray-400 hover:text-white transition-all duration-200"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold px-5 py-2 rounded-full text-sm transition-all duration-200"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </header>

      <main className="relative z-10 max-w-[680px] mx-auto px-4 py-10 space-y-8">

        {/* Hero */}
        <div className="relative rounded-3xl overflow-hidden py-20 px-6 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-green-900/40 via-[#091409]/90 to-[#080808]" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(34,197,94,0.07) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          {/* Central green bloom behind heading */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-40 rounded-full blur-3xl" style={{ background: 'radial-gradient(ellipse, rgba(34,197,94,0.12) 0%, transparent 70%)' }} />
          <div className="relative space-y-4">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 text-green-400 text-xs font-semibold mb-2">
              ☪️ Trusted by the Muslim community
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
              Find Halal Food<br />
              <span className="text-green-400 relative inline-block">
                <span className="absolute inset-0 blur-3xl bg-green-500/20 rounded-full scale-110 -z-10" />
                You Can Trust
              </span>
            </h2>
            <p className="text-gray-400 text-base max-w-md mx-auto leading-relaxed mt-2">
              Real reviews from the Muslim community.<br />Only fully halal certified restaurants.
            </p>
          </div>
        </div>

        {/* Search bar + city filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search halal restaurants, cuisines…"
              className="w-full bg-[#111111] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-green-500/40 focus:ring-2 focus:ring-green-500/10 transition-all duration-200 text-sm tracking-wide shadow-inner"
            />
          </div>
          <select
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            className="flex-shrink-0 bg-[#111111] border border-white/10 rounded-2xl px-3 py-4 text-sm text-gray-300 focus:outline-none focus:border-green-500/40 transition-all duration-200 cursor-pointer max-w-[140px]"
          >
            <option value="All Cities">All Cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Halal-only banner */}
        <div className="relative flex items-center gap-3 bg-green-500/5 border border-green-500/15 rounded-2xl px-4 py-3 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl bg-green-500/60 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          <span className="text-base leading-none">☪️</span>
          <p className="text-green-400 text-sm font-medium">Only showing fully halal certified restaurants</p>
        </div>

        {/* Cuisine filter pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setOpenNowFilter(v => !v)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 flex items-center gap-1.5 ${
              openNowFilter
                ? 'bg-green-500 text-white shadow-md shadow-green-500/20'
                : 'bg-transparent text-gray-400 hover:text-gray-200 border border-white/15 hover:border-white/30'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${openNowFilter ? 'bg-white' : 'bg-green-500'}`} />
            Open Now
          </button>
          <button
            onClick={() => setCuisineFilter(cuisineFilter === 'Favourites' ? 'All' : 'Favourites')}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 flex items-center gap-1.5 ${
              cuisineFilter === 'Favourites'
                ? 'bg-green-500 text-white shadow-md shadow-green-500/20'
                : 'bg-transparent text-gray-400 hover:text-gray-200 border border-white/15 hover:border-white/30'
            }`}
          >
            <svg className="w-3 h-3" fill={cuisineFilter === 'Favourites' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Favourites
          </button>
          {(showAllCuisines ? CUISINES : CUISINES.slice(0, 5)).map(c => (
            <button
              key={c}
              onClick={() => setCuisineFilter(c)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 ${
                cuisineFilter === c
                  ? 'bg-green-500 text-white shadow-md shadow-green-500/20'
                  : 'bg-transparent text-gray-400 hover:text-gray-200 border border-white/15 hover:border-white/30'
              }`}
            >
              {c}
            </button>
          ))}
          <button
            onClick={() => setShowAllCuisines(v => !v)}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 bg-transparent text-green-400 border border-green-500/30 hover:border-green-500/60 hover:text-green-300"
          >
            {showAllCuisines ? 'Less −' : 'More +'}
          </button>
        </div>

        {/* Add restaurant — owner-only section */}
        {user && userRole !== 'customer' && (
          <div className="space-y-3">
            {/* Trial active badge — only owners who subscribed reach this */}
            {!loadingSub && isSubscribed() && subscription?.status === 'trialing' && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-3 flex items-center gap-2.5">
                <span className="text-base">✅</span>
                <p className="text-green-400 text-sm font-medium">Free trial active — enjoy HalalSpot {isPro() ? 'Pro' : 'Basic'}!</p>
              </div>
            )}

            {/* Verify your business section */}
            {verifySubmitted ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-3 flex items-center gap-2.5">
                <span className="text-base">✅</span>
                <p className="text-green-400 text-sm font-medium">Verification submitted — pending review.</p>
              </div>
            ) : showVerifyForm ? (
              <div className="bg-[#111111] rounded-2xl p-5 border border-white/5 space-y-5">
                <h3 className="text-sm font-semibold text-white">Verify your business</h3>

                {/* Proof documents */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Proof Documents <span className="text-red-400">*</span>
                    <span className="ml-1 text-gray-600 normal-case font-normal">(up to 5 files, 5MB each — at least 1 PDF or 2 images required)</span>
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    multiple
                    onChange={handleVerifyFiles}
                    className="block w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-green-500/10 file:text-green-400 hover:file:bg-green-500/20 file:transition-colors file:cursor-pointer cursor-pointer"
                  />
                  {verifyFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {verifyFiles.map((f, i) =>
                        f.type.startsWith('image/') ? (
                          <img
                            key={i}
                            src={URL.createObjectURL(f)}
                            alt={f.name}
                            className="w-16 h-16 object-cover rounded-lg border border-white/10"
                          />
                        ) : (
                          <div key={i} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                            <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/></svg>
                            <span className="text-xs text-gray-300 max-w-[120px] truncate">{f.name}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Business License */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Business License <span className="text-red-400">*</span>
                    <span className="ml-1 text-gray-600 normal-case font-normal">(1 file, max 5MB)</span>
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={e => handleSingleFile(e, setBusinessLicenseFile)}
                    className="block w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-green-500/10 file:text-green-400 hover:file:bg-green-500/20 file:transition-colors file:cursor-pointer cursor-pointer"
                  />
                  {businessLicenseFile && (
                    <div className="mt-1">
                      {businessLicenseFile.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(businessLicenseFile)} alt="Business License" className="w-20 h-20 object-cover rounded-lg border border-white/10" />
                      ) : (
                        <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                          <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/></svg>
                          <span className="text-xs text-gray-300 max-w-[160px] truncate">{businessLicenseFile.name}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Health Permit */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Health Permit / Food Safety Certificate <span className="text-red-400">*</span>
                    <span className="ml-1 text-gray-600 normal-case font-normal">(1 file, max 5MB)</span>
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={e => handleSingleFile(e, setHealthPermitFile)}
                    className="block w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-green-500/10 file:text-green-400 hover:file:bg-green-500/20 file:transition-colors file:cursor-pointer cursor-pointer"
                  />
                  {healthPermitFile && (
                    <div className="mt-1">
                      {healthPermitFile.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(healthPermitFile)} alt="Health Permit" className="w-20 h-20 object-cover rounded-lg border border-white/10" />
                      ) : (
                        <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                          <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/></svg>
                          <span className="text-xs text-gray-300 max-w-[160px] truncate">{healthPermitFile.name}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Halal Certification Certificate */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Halal Certification Certificate <span className="text-red-400">*</span>
                    <span className="ml-1 text-gray-600 normal-case font-normal">(1 file, max 5MB)</span>
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={e => handleSingleFile(e, setHalalCertFile)}
                    className="block w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-green-500/10 file:text-green-400 hover:file:bg-green-500/20 file:transition-colors file:cursor-pointer cursor-pointer"
                  />
                  {halalCertFile && (
                    <div className="mt-1">
                      {halalCertFile.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(halalCertFile)} alt="Halal Certificate" className="w-20 h-20 object-cover rounded-lg border border-white/10" />
                      ) : (
                        <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                          <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/></svg>
                          <span className="text-xs text-gray-300 max-w-[160px] truncate">{halalCertFile.name}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Certifying body + cert number + expiry */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Certifying Body <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={certifyingBody}
                    onChange={e => setCertifyingBody(e.target.value)}
                    className="w-full bg-[#1A1A1A] rounded-xl px-4 py-2.5 text-sm text-gray-100 border border-white/10 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all duration-200"
                  >
                    <option value="">Select certifying body…</option>
                    {CERTIFYING_BODIES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <input
                    value={certNumber}
                    onChange={e => setCertNumber(e.target.value)}
                    placeholder="Certification Number *"
                    className="w-full bg-[#1A1A1A] rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 border border-white/10 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all duration-200"
                  />
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Certificate Expiry Date <span className="text-red-400">*</span></label>
                    <input
                      type="date"
                      value={certExpiry}
                      onChange={e => setCertExpiry(e.target.value)}
                      className="w-full bg-[#1A1A1A] rounded-xl px-4 py-2.5 text-sm text-gray-100 border border-white/10 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Online presence */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Online Presence <span className="text-gray-600 normal-case font-normal">(optional)</span></label>
                  <input
                    value={websiteUrl}
                    onChange={e => setWebsiteUrl(e.target.value)}
                    placeholder="Website URL (e.g. https://myrestaurant.com)"
                    className="w-full bg-[#1A1A1A] rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 border border-white/10 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all duration-200"
                  />
                  <input
                    value={mapsUrl}
                    onChange={e => setMapsUrl(e.target.value)}
                    placeholder="Google Maps link"
                    className="w-full bg-[#1A1A1A] rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 border border-white/10 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all duration-200"
                  />
                </div>

                {/* Confirmation checkbox */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={confirmOwnership}
                    onChange={e => setConfirmOwnership(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-green-500 flex-shrink-0"
                  />
                  <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
                    I confirm this is my business and I understand false claims will result in a permanent ban
                    <span className="text-red-400 ml-1">*</span>
                  </span>
                </label>

                {/* Error */}
                {verifyError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <p className="text-red-400 text-sm">{verifyError}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={submitVerification}
                    disabled={verifyLoading}
                    className="bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-xl text-sm transition-all duration-200"
                  >
                    {verifyLoading ? 'Uploading…' : 'Submit Verification'}
                  </button>
                  <button
                    onClick={() => { setShowVerifyForm(false); setVerifyError(''); }}
                    disabled={verifyLoading}
                    className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowVerifyForm(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-green-400 hover:text-green-300 transition-all duration-200"
              >
                <span className="text-base leading-none">🏪</span>
                Verify your business
              </button>
            )}

            {!addingRestaurant ? (
              <button
                onClick={() => setAddingRestaurant(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-green-400 hover:text-green-300 transition-all duration-200"
              >
                <span className="text-base leading-none font-bold">+</span>
                Add a restaurant
              </button>
            ) : !isSubscribed() ? (
              /* Not subscribed — show trial CTA instead of the form */
              <div className="relative overflow-hidden rounded-2xl border border-green-500/20">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/15 via-green-500/5 to-transparent pointer-events-none" />
                <div className="relative px-5 py-5 space-y-3">
                  <div>
                    <p className="text-green-300 font-semibold text-sm">Start your free trial to add your restaurant</p>
                    <p className="text-green-400/60 text-xs mt-1">7 days free, then from $20/month. Cancel anytime.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleShowPricing}
                      className="bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-green-500/20"
                    >
                      Get started →
                    </button>
                    <button
                      onClick={() => setAddingRestaurant(false)}
                      className="text-sm text-gray-400 hover:text-white px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Subscribed — show the form */
              <div className="bg-[#111111] rounded-2xl p-5 border border-white/5 space-y-3">
                <h3 className="text-sm font-semibold text-white">Add restaurant</h3>
                <input
                  value={newRestName}
                  onChange={e => setNewRestName(e.target.value)}
                  placeholder="Restaurant name"
                  className="w-full bg-[#1A1A1A] rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 border border-white/10 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all duration-200"
                />
                <input
                  value={newRestLocation}
                  onChange={e => setNewRestLocation(e.target.value)}
                  placeholder="Location (e.g. Dallas, TX)"
                  className="w-full bg-[#1A1A1A] rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 border border-white/10 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all duration-200"
                />
                <input
                  value={newCertNumber}
                  onChange={e => setNewCertNumber(e.target.value)}
                  placeholder="Halal certification number (optional)"
                  className="w-full bg-[#1A1A1A] rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 border border-white/10 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all duration-200"
                />
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Cover photo <span className="text-gray-600">(optional)</span></label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="flex items-center gap-2 bg-[#1A1A1A] border border-white/10 hover:border-green-500/30 rounded-xl px-4 py-2.5 transition-all duration-200">
                      <svg className="w-4 h-4 text-gray-500 group-hover:text-green-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
                        {coverPhotoFile ? coverPhotoFile.name : 'Upload cover photo'}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          setCoverPhotoFile(file);
                          setCoverPhotoPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                  {coverPhotoPreview && (
                    <img src={coverPhotoPreview} alt="Cover preview" className="mt-2 h-24 w-full object-cover rounded-xl border border-white/10" />
                  )}
                </div>
                {/* Business hours */}
                <div className="space-y-2">
                  <label className="block text-xs text-gray-500">Business hours</label>
                  <div className="space-y-1.5">
                    {DAYS.map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-8 flex-shrink-0">{label}</span>
                        {hoursInput[key].closed ? (
                          <span className="flex-1 text-xs text-gray-600 italic">Closed</span>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-1">
                            <input
                              type="time"
                              value={hoursInput[key].open}
                              onChange={e => setHoursInput(prev => ({ ...prev, [key]: { ...prev[key], open: e.target.value } }))}
                              className="bg-[#1A1A1A] border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-green-500/40 w-24"
                            />
                            <span className="text-gray-600 text-xs">–</span>
                            <input
                              type="time"
                              value={hoursInput[key].close}
                              onChange={e => setHoursInput(prev => ({ ...prev, [key]: { ...prev[key], close: e.target.value } }))}
                              className="bg-[#1A1A1A] border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-green-500/40 w-24"
                            />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setHoursInput(prev => ({ ...prev, [key]: { ...prev[key], closed: !prev[key].closed } }))}
                          className={`text-[10px] font-medium px-2 py-1 rounded-lg transition-all duration-200 flex-shrink-0 ${
                            hoursInput[key].closed
                              ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                              : 'bg-white/5 text-gray-500 border border-white/10 hover:text-gray-300'
                          }`}
                        >
                          {hoursInput[key].closed ? 'Closed' : 'Set closed'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addRestaurant}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all duration-200"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setAddingRestaurant(false)}
                    className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}


        {/* Top Rated section */}
        {topRated.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <span className="text-yellow-400">⭐</span> Top Rated
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
              {topRated.map(rest => (
                <button
                  key={rest.id}
                  onClick={() => openRestaurant(rest)}
                  className="flex-shrink-0 w-44 bg-[#111111] rounded-2xl overflow-hidden border border-white/5 hover:border-green-500/20 hover:-translate-y-1 transition-all duration-200 text-left"
                >
                  <div className="h-24 relative overflow-hidden">
                    <img
                      src={rest.coverImageUrl || CUISINE_IMAGES[rest.cuisine] || DEFAULT_FOOD_IMAGE}
                      alt={rest.name}
                      className="w-full h-full object-cover"
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-white text-xs font-bold line-clamp-1">{rest.name}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400 text-xs">⭐</span>
                      <span className="text-xs font-semibold text-white">{rest.avg}</span>
                      <span className="text-xs text-gray-500">({rest.count})</span>
                    </div>
                    {rest.cuisine && <span className="text-[10px] text-green-400">{rest.cuisine}</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="relative flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />
          <span className="text-[10px] font-semibold text-green-500/40 tracking-widest uppercase">Restaurants</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />
        </div>

        {/* Restaurant list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loadingRestaurants ? (
            /* Skeleton cards */
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-40 bg-white/5" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-white/5 rounded-full w-3/5" />
                  <div className="h-3 bg-white/5 rounded-full w-2/5" />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="col-span-2 text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-green-500/20" />
                <div className="absolute inset-3 rounded-full border-2 border-green-500/10" />
                <span className="text-3xl">🕌</span>
              </div>
              <p className="text-white font-semibold text-lg">No halal restaurants found</p>
              <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">Try a different search term or cuisine filter</p>
              {(cuisineFilter !== 'All' || openNowFilter) && (
                <div className="flex flex-col items-center gap-2 mt-4">
                  {cuisineFilter !== 'All' && (
                    <button onClick={() => setCuisineFilter('All')} className="text-sm text-green-400 hover:text-green-300 transition-colors">
                      Clear cuisine filter
                    </button>
                  )}
                  {openNowFilter && (
                    <button onClick={() => setOpenNowFilter(false)} className="text-sm text-green-400 hover:text-green-300 transition-colors">
                      Clear "Open Now" filter
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            filtered.map(rest => {
              const certStatus = certExpiryStatus(rest.certExpiryDate);
              const stats = reviewStats[rest.id];
              return (
                <div
                  key={rest.id}
                  onClick={() => openRestaurant(rest)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && openRestaurant(rest)}
                  className="group bg-[#111111] rounded-2xl overflow-hidden border border-white/5 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-green-500/10 hover:border-green-500/15 transition-all duration-300 text-left w-full cursor-pointer"
                >
                  {/* Image area */}
                  <div className="relative h-40 bg-gradient-to-br from-green-950/60 via-[#0d1f0d] to-[#111111] flex items-center justify-center overflow-hidden">
                    <img
                      src={rest.coverImageUrl || CUISINE_IMAGES[rest.cuisine] || DEFAULT_FOOD_IMAGE}
                      alt={rest.cuisine || rest.name}
                      className="w-full h-full object-cover"
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                    {/* Bottom gradient overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                    {/* Halal badge */}
                    <div className="absolute top-2.5 right-2.5">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-500 text-white shadow-lg">
                        ✓ Halal
                      </span>
                    </div>
                    {/* Verified owner badge */}
                    {rest.verifiedOwner && (
                      <div className="absolute top-2.5 left-2.5">
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-500/80 text-white">
                          ✓ Verified
                        </span>
                      </div>
                    )}
                    {/* Cert expiry warning */}
                    {certStatus === 'expired' && (
                      <div className="absolute bottom-0 inset-x-0 bg-red-500/80 text-white text-[10px] font-bold text-center py-1">
                        ⚠ Certificate Expired
                      </div>
                    )}
                    {certStatus === 'expiring' && (
                      <div className="absolute bottom-0 inset-x-0 bg-yellow-500/80 text-black text-[10px] font-bold text-center py-1">
                        ⚠ Certificate Expiring Soon
                      </div>
                    )}
                  </div>
                  {/* Card body */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-white text-sm leading-snug line-clamp-1">{rest.name}</h3>
                      <button
                        onClick={e => toggleFavourite(e, rest.id)}
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors duration-200"
                        aria-label={favourites.has(rest.id) ? 'Remove from favourites' : 'Add to favourites'}
                      >
                        {favourites.has(rest.id) ? (
                          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        )}
                      </button>
                      {(() => {
                        const s = getOpenStatus(rest.hours);
                        if (!s) return null;
                        const styles = {
                          open:    'bg-green-500/15 text-green-400 border-green-500/25',
                          closing: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
                          closed:  'bg-white/5 text-gray-500 border-white/10',
                        };
                        return (
                          <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${styles[s.status]}`}>
                            {s.status === 'open' ? '● ' : s.status === 'closing' ? '● ' : ''}{s.status === 'open' ? 'Open' : s.status === 'closing' ? 'Closing soon' : 'Closed'}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {rest.cuisine && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/15">
                          {rest.cuisine}
                        </span>
                      )}
                      {(() => {
                        const s = getOpenStatus(rest.hours);
                        if (!s) return null;
                        return <span className="text-[11px] text-gray-600">{s.label}</span>;
                      })()}
                    </div>
                    {stats ? (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-yellow-400">⭐</span>
                        <span className="font-semibold text-white">{stats.avg}</span>
                        <span className="text-gray-500">({stats.count} review{stats.count !== 1 ? 's' : ''})</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-600">No reviews yet</span>
                    )}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <span className="truncate">{rest.location}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* PWA install banner — mobile only, appears after 30s */}
      {showInstallBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#111111] border-t border-white/10 px-4 py-4 flex items-center justify-between gap-3 sm:hidden">
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold">Install HalalSpot</p>
            <p className="text-gray-500 text-xs truncate">Add to your home screen for quick access</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={async () => {
                if (deferredPrompt) {
                  deferredPrompt.prompt();
                  await deferredPrompt.userChoice;
                  setDeferredPrompt(null);
                }
                setShowInstallBanner(false);
              }}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all duration-200"
            >
              Install
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-sm transition-all duration-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
