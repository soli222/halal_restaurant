import { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function useSubscription(user, handleLogin, showToast) {
  const [subscription, setSubscription] = useState(null);
  const [loadingSub, setLoadingSub] = useState(false);       // checkout redirect only
  const [upgradingToPro, setUpgradingToPro] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);

  async function fetchSubscription(userId) {
    // Uses its own try/catch — does NOT touch loadingSub so it never disables buttons
    try {
      const snap = await getDoc(doc(db, 'subscriptions', userId));
      setSubscription(snap.exists() ? snap.data() : null);
    } catch (e) { setSubscription(null); }
  }

  function isSubscribed() {
    if (!subscription) return false;
    return ['active', 'trialing'].includes(subscription.status);
  }

  function isPro() {
    if (!subscription) return false;
    // Pro plan amount is 4000 cents ($40). Basic is 3000 cents ($30).
    return subscription.plan === 'pro' || subscription.amount === 4000;
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

  async function handleUpgrade() {
    if (!user) return;
    setUpgradingToPro(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/upgrade-subscription', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        showToast('Upgrade scheduled! Your Pro plan begins at the next billing date.');
        await fetchSubscription(user.uid);
      } else {
        showToast(data.error || 'Upgrade failed. Please try again.', 'error');
      }
    } catch (e) {
      showToast('Upgrade failed. Please try again.', 'error');
    }
    setUpgradingToPro(false);
  }

  async function handleCancel() {
    if (!user) return;
    setCancellingSubscription(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        showToast('Subscription cancelled — you keep access until your billing period ends.');
        await fetchSubscription(user.uid);
      } else {
        showToast(data.error || 'Cancellation failed. Please try again.', 'error');
      }
    } catch (e) {
      showToast('Cancellation failed. Please try again.', 'error');
    }
    setCancellingSubscription(false);
  }

  return { subscription, loadingSub, upgradingToPro, cancellingSubscription, fetchSubscription, isSubscribed, isPro, handleSubscribe, handleUpgrade, handleCancel };
}
