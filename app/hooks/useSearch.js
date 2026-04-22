import { useState, useEffect, useRef, useMemo } from 'react';
import { getOpenStatus } from '../utils/restaurant';

export function useSearch(restaurants, reviewStats, favourites) {
  const [search, setSearch] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All Cities');
  const [openNowFilter, setOpenNowFilter] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [showAllCuisines, setShowAllCuisines] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowInstallBanner(true), 30000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cities = useMemo(() => (
    [...new Set(restaurants.map(r => r.city || r.location?.split(',')[0]?.trim()).filter(Boolean))].sort()
  ), [restaurants]);

  const filtered = useMemo(() => restaurants.filter(r => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || r.name?.toLowerCase().includes(q) || r.location?.toLowerCase().includes(q) || r.cuisine?.toLowerCase().includes(q);
    const matchesCuisine = cuisineFilter === 'All' || (cuisineFilter === 'Favourites' ? favourites.has(r.id) : r.cuisine?.toLowerCase().includes(cuisineFilter.toLowerCase()));
    const matchesCity = cityFilter === 'All Cities' || r.city === cityFilter || r.location?.includes(cityFilter);
    const matchesOpen = !openNowFilter || ['open', 'closing'].includes(getOpenStatus(r.hours)?.status);
    return matchesSearch && matchesCuisine && matchesCity && matchesOpen;
  }), [restaurants, search, cuisineFilter, cityFilter, openNowFilter, favourites]);

  const sortedFiltered = useMemo(() => {
    const arr = [...filtered];
    if (sortBy === 'rating') return arr.sort((a, b) => (reviewStats[b.id]?.avg || 0) - (reviewStats[a.id]?.avg || 0));
    if (sortBy === 'most_reviewed') return arr.sort((a, b) => (reviewStats[b.id]?.count || 0) - (reviewStats[a.id]?.count || 0));
    if (sortBy === 'newest') return arr.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    return arr;
  }, [filtered, sortBy, reviewStats]);

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const names = restaurants.filter(r => r.name?.toLowerCase().includes(q)).slice(0, 4).map(r => ({ type: 'restaurant', label: r.name, id: r.id }));
    const uniqueCities = [...new Set(restaurants.map(r => r.city).filter(Boolean))];
    const cityMatches = uniqueCities.filter(c => c.toLowerCase().includes(q)).slice(0, 2).map(c => ({ type: 'city', label: c }));
    const uniqueCuisines = [...new Set(restaurants.map(r => r.cuisine).filter(Boolean))];
    const cuisineMatches = uniqueCuisines.filter(c => c.toLowerCase().includes(q)).slice(0, 2).map(c => ({ type: 'cuisine', label: c }));
    return [...names, ...cityMatches, ...cuisineMatches];
  }, [search, restaurants]);

  function handleSuggestionSelect(suggestion) {
    if (suggestion.type === 'restaurant') {
      setSearch('');
      setShowSuggestions(false);
      setTimeout(() => {
        document.getElementById(`restaurant-${suggestion.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    } else if (suggestion.type === 'city') {
      setCityFilter(suggestion.label);
      setSearch('');
      setShowSuggestions(false);
    } else if (suggestion.type === 'cuisine') {
      setCuisineFilter(suggestion.label);
      setSearch('');
      setShowSuggestions(false);
    }
    setHighlightedIdx(-1);
  }

  return {
    search, setSearch,
    cuisineFilter, setCuisineFilter,
    cityFilter, setCityFilter,
    openNowFilter, setOpenNowFilter,
    sortBy, setSortBy,
    showAllCuisines, setShowAllCuisines,
    showSuggestions, setShowSuggestions,
    highlightedIdx, setHighlightedIdx,
    showInstallBanner, setShowInstallBanner,
    deferredPrompt,
    searchContainerRef,
    cities, filtered, sortedFiltered, suggestions,
    handleSuggestionSelect,
  };
}
