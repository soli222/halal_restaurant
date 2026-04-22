import { useState, useMemo } from 'react';
import { db, storage } from '../lib/firebase';
import {
  collection, addDoc, getDocs, query, orderBy, where,
  doc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { DEFAULT_HOURS } from '../constants';

export function useRestaurants(user, setView, showToast) {
  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [reviewStats, setReviewStats] = useState({});
  const [selected, setSelected] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [addingRestaurant, setAddingRestaurant] = useState(false);
  const [newRestName, setNewRestName] = useState('');
  const [newRestLocation, setNewRestLocation] = useState('');
  const [newCertNumber, setNewCertNumber] = useState('');

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

  async function openRestaurant(rest, setReviews, setAiSummary, setAdvancedSummary) {
    setSelected(rest);
    setView('restaurant');
    setAiSummary('');
    setAdvancedSummary('');
    const r = await fetchReviews(rest.id);
    setReviews(r);
    try {
      const prev = JSON.parse(localStorage.getItem('halalspot_recent') || '[]');
      const updated = [rest.id, ...prev.filter(id => id !== rest.id)].slice(0, 5);
      localStorage.setItem('halalspot_recent', JSON.stringify(updated));
      setRecentlyViewed(updated);
    } catch (e) {}
  }

  async function addRestaurant({ coverPhotoFile, hoursInput, setCoverPhotoFile, setCoverPhotoPreview, setHoursInput }) {
    if (!newRestName.trim() || !newRestLocation.trim()) {
      return showToast('Please fill in restaurant name and location.', 'error');
    }
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
    (async () => {
      try {
        const q = encodeURIComponent(`${newRestName.trim()} ${newRestLocation.trim()}`);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
          headers: { 'User-Agent': 'HalalSpot/1.0' },
        });
        const data = await res.json();
        if (data.length > 0) {
          await updateDoc(doc(db, 'restaurants', docRef.id), {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          });
        }
      } catch (_) {}
    })();
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

  const topRated = useMemo(() => (
    restaurants
      .filter(r => reviewStats[r.id]?.count >= 3)
      .map(r => ({ ...r, avg: reviewStats[r.id].avg, count: reviewStats[r.id].count }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5)
  ), [restaurants, reviewStats]);

  const recentRestaurants = useMemo(() => (
    recentlyViewed.map(id => restaurants.find(r => r.id === id)).filter(Boolean)
  ), [recentlyViewed, restaurants]);

  return {
    restaurants, loadingRestaurants, reviewStats, setReviewStats,
    selected, setSelected,
    recentlyViewed, setRecentlyViewed,
    addingRestaurant, setAddingRestaurant,
    newRestName, setNewRestName,
    newRestLocation, setNewRestLocation,
    newCertNumber, setNewCertNumber,
    fetchRestaurants, fetchAllReviewStats, fetchReviews,
    openRestaurant, addRestaurant,
    topRated, recentRestaurants,
  };
}
