import { useState, useEffect } from 'react';
import { auth, db, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export function useAuth(showToast) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [pendingOwnerSignup, setPendingOwnerSignup] = useState(false);
  const [pendingOwnerSubmit, setPendingOwnerSubmit] = useState(false);
  const [confirmSwitchRole, setConfirmSwitchRole] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Resolve role from Firestore before setting user so both land in the
        // same React render — avoids the intermediate "user set, role null" flash.
        const snap = await getDoc(doc(db, 'users', u.uid));
        const data = snap.exists() ? snap.data() : {};
        if (data.role) {
          setUserRole(data.role);
          setOnboardingComplete(!!data.onboardingComplete);
        } else if (pendingOwnerSignup || pendingOwnerSubmit) {
          await setDoc(doc(db, 'users', u.uid), { role: 'owner' }, { merge: true });
          setUserRole('owner');
          setOnboardingComplete(false);
          setPendingOwnerSignup(false);
          setPendingOwnerSubmit(false);
        } else {
          // New users default to customer — no role picker needed
          await setDoc(doc(db, 'users', u.uid), { role: 'customer' }, { merge: true });
          setUserRole('customer');
          setOnboardingComplete(false);
        }
        setUser(u);
      } else {
        setUser(null);
        setUserRole(null);
        setOnboardingComplete(false);
      }
    });
    return unsub;
  }, [pendingOwnerSignup, pendingOwnerSubmit]);

  async function handleLogin() {
    try { await signInWithPopup(auth, googleProvider); }
    catch (e) {
      console.error('Sign in error:', e.code, e.message);
      const ignored = [
        'auth/popup-closed-by-user',
        'auth/cancelled-popup-request',
      ];
      // Firebase throws a plain Error (no .code) for internal assertion failures
      // when the popup is dismissed mid-flow — treat these as cancellations too.
      if (!ignored.includes(e.code) && !e.message?.includes('INTERNAL ASSERTION FAILED')) {
        showToast('Sign in failed. Please try again.', 'error');
      }
    }
  }

  async function handleLogout() {
    await signOut(auth);
  }

  async function handleRoleSelect(role) {
    if (!user) return;
    // Only allow safe roles — prevent self-elevation to admin
    if (!['customer', 'owner'].includes(role)) return;
    await setDoc(doc(db, 'users', user.uid), { role }, { merge: true });
    setUserRole(role);
  }

  async function completeOnboarding() {
    if (user) {
      await setDoc(doc(db, 'users', user.uid), { onboardingComplete: true }, { merge: true });
    }
    setOnboardingComplete(true);
  }

  return {
    user,
    userRole, setUserRole,
    onboardingComplete, setOnboardingComplete,
    pendingOwnerSignup, setPendingOwnerSignup,
    pendingOwnerSubmit, setPendingOwnerSubmit,
    confirmSwitchRole, setConfirmSwitchRole,
    handleLogin, handleLogout, handleRoleSelect, completeOnboarding,
  };
}
