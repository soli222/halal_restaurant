'use client';
import { useState, useEffect } from 'react';
import { auth, db, googleProvider } from '../../lib/firebase';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment } from 'firebase/firestore';

const RATING_OPTIONS = [
  { value: 'recommended', label: '✅ Highly Recommended', selected: 'bg-green-500 text-white shadow-lg shadow-green-500/20' },
  { value: 'good', label: '👍 Good', selected: 'bg-emerald-400 text-white shadow-lg shadow-emerald-400/20' },
  { value: 'average', label: '😐 Average', selected: 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' },
  { value: 'not_recommended', label: '👎 Not Recommended', selected: 'bg-red-500 text-white shadow-lg shadow-red-500/20' },
];

export default function ReviewPage({ params }) {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState('recommended');
  const [certVisible, setCertVisible] = useState(null);
  const [familyFriendly, setFamilyFriendly] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [guestName, setGuestName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toasts, setToasts] = useState([]);

  function showToast(message, type = 'success') {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    async function loadRestaurant() {
      try {
        const snap = await getDoc(doc(db, 'restaurants', params.id));
        setRestaurant(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      } catch (e) {
        setRestaurant(null);
      }
      setLoading(false);
    }
    loadRestaurant();
  }, [params.id]);

  async function handleLogin() {
    try { await signInWithPopup(auth, googleProvider); }
    catch (e) { showToast('Sign in failed. Please try again.', 'error'); }
  }

  async function submitReview() {
    if (!reviewText.trim()) return showToast('Please write a review before submitting.', 'error');
    if (!user && !guestName.trim()) return showToast('Please enter your name.', 'error');
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        userId: user ? user.uid : null,
        userName: user ? user.displayName : guestName.trim(),
        userPhoto: user ? user.photoURL : null,
        text: reviewText,
        rating,
        certVisible,
        familyFriendly,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'restaurants', restaurant.id), {
        reviewCount: increment(1),
      });
      setSubmitted(true);
    } catch (e) {
      showToast('Failed to submit review. Please try again.', 'error');
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className={`min-h-screen bg-[#0A0A0A] flex items-center justify-center`}>
        <div className="w-6 h-6 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className={`min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4`}>
        <div className="text-center">
          <p className="text-4xl mb-3">🍽</p>
          <p className="text-white font-semibold">Restaurant not found</p>
          <p className="text-gray-500 text-sm mt-1">This review link may be invalid.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={`min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4`}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Thank you!</h2>
          <p className="text-gray-400 text-sm mt-2">
            Your review for <span className="text-white font-medium">{restaurant.name}</span> has been submitted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-100">

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
      <header className="bg-[#111111] border-b border-white/5 px-4 py-4 text-center">
        <h1 className="text-base font-bold text-white flex items-center justify-center gap-2">
          <span>☪️</span>
          <span>HalalSpot</span>
        </h1>
      </header>

      <main className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Restaurant name */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-500/15 flex items-center justify-center text-green-400 font-bold text-2xl mx-auto mb-3">
            {restaurant.name?.[0]?.toUpperCase()}
          </div>
          <h2 className="text-xl font-bold text-white">{restaurant.name}</h2>
          <p className="text-gray-500 text-sm mt-1 flex items-center justify-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {restaurant.location}
          </p>
          <p className="text-gray-700 text-xs mt-2">☪️ Only fully halal certified restaurants</p>
        </div>

        <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 space-y-4">
          {/* Identity row */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">How was your experience?</p>
            {user ? (
              <span className="text-xs text-gray-500 flex items-center gap-1.5">
                <img src={user.photoURL} alt="" className="w-4 h-4 rounded-full" />
                {user.displayName}
              </span>
            ) : (
              <button
                onClick={handleLogin}
                className="text-xs text-green-400 hover:text-green-300 transition-all duration-200"
              >
                Sign in instead
              </button>
            )}
          </div>

          {/* Name input for guests */}
          {!user && (
            <input
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-[#1A1A1A] rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 border border-white/10 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all duration-200"
            />
          )}

          {/* Rating buttons */}
          <div className="flex gap-2">
            {RATING_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setRating(opt.value)}
                className={`flex-1 py-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  rating === opt.value
                    ? opt.selected
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Review text */}
          <textarea
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            placeholder="Tell us about your visit — food, service, atmosphere..."
            rows={4}
            className="w-full bg-[#1A1A1A] rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 border border-white/10 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 resize-none transition-all duration-200"
          />

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

          <button
            onClick={submitReview}
            disabled={submitting || !reviewText.trim() || (!user && !guestName.trim())}
            className="w-full bg-green-500 hover:bg-green-600 active:scale-[0.99] text-white font-bold py-3.5 rounded-xl text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </main>
    </div>
  );
}
