import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export function useFavourites(user, handleLogin) {
  const [favourites, setFavourites] = useState(new Set());

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

  return { favourites, setFavourites, fetchFavourites, toggleFavourite };
}
