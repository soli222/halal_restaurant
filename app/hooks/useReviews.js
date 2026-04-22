import { useState, useRef } from 'react';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export function useReviews(user, selected, showToast, setReviewStats) {
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
  const [certVisible, setCertVisible] = useState(null);
  const [familyFriendly, setFamilyFriendly] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported] = useState(() =>
    typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
  const recognitionRef = useRef(null);

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function toggleListening() {
    if (isListening) { recognitionRef.current?.stop(); return; }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join(' ');
      setReviewText(prev => prev ? prev + ' ' + transcript : transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  async function submitReview(fetchReviews) {
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
        certVisible,
        familyFriendly,
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
    } catch (e) { showToast('Failed to post review. Please try again.', 'error'); }
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
    } catch (e) { showToast('Failed to post reply. Please try again.', 'error'); }
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
    } catch (e) { setAiSummary('Could not generate summary.'); }
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
    } catch (e) { setAdvancedSummary('Could not generate advanced insights.'); }
    setLoadingAdvanced(false);
  }

  async function shareRestaurant() {
    const url = `${window.location.origin}/review/${selected.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: selected.name, text: `Check out ${selected.name} on HalalSpot!`, url }); }
      catch (e) {}
    } else {
      try { await navigator.clipboard.writeText(url); showToast('Link copied!'); }
      catch (e) { showToast('Could not copy link', 'error'); }
    }
  }

  function ratingCount(val) { return reviews.filter(r => r.rating === val).length; }

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
    let thisWeek = 0, lastWeek = 0;
    reviews.forEach(r => {
      const d = r.createdAt?.toDate?.();
      if (!d) return;
      if (d >= startOfThisWeek) thisWeek++;
      else if (d >= startOfLastWeek) lastWeek++;
    });
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

  return {
    reviews, setReviews,
    reviewText, setReviewText,
    rating, setRating,
    photo, photoPreview,
    submitting,
    aiSummary, setAiSummary, loadingSummary,
    advancedSummary, setAdvancedSummary, loadingAdvanced,
    certVisible, setCertVisible,
    familyFriendly, setFamilyFriendly,
    replyingTo, setReplyingTo,
    replyText, setReplyText,
    submittingReply,
    isListening, speechSupported,
    handlePhotoChange, toggleListening,
    submitReview, submitReply,
    generateSummary, generateAdvancedSummary,
    shareRestaurant, getAnalytics, ratingCount,
  };
}
