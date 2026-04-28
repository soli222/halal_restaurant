import { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function useSubscription(user, handleLogin, showToast) {
  const [subscription, setSubscription] = useState(null);
  const [loadingSub, setLoadingSub] = useState(false);

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
      const token = await user.getIdToken();
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.uid, email: user.email, plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast('Something went wrong. Please try again.', 'error');
      }
    } catch (e) { showToast('Something went wrong. Please try again.', 'error'); }
    setLoadingSub(false);
  }

  return { subscription, loadingSub, fetchSubscription, isSubscribed, isPro, handleSubscribe };
}
