import { useState, useEffect, useRef, useMemo } from 'react';
import { getOpenStatus } from '../utils/restaurant';

export function useSearch(restaurants, reviewStats, favourites) {
  const [search, setSearch] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All Cities');
  const [openNowFilter, setOpenNowFilter] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [halalStandardFilter, setHalalStandardFilter] = useState('All');
  const [showAllCuisines, setShowAllCuisines] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Location typeahead
  const [locationSearch, setLocationSearch] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const searchContainerRef = useRef(null);
  const locationRef = useRef(null);

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
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setShowLocationDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Flat list of location options: city+state combos, states, zips
  const locationOptions = useMemo(() => {
    const seen = new Set();
    const opts = [];
    restaurants.forEach(r => {
      const city = r.city || r.location?.split(',')[0]?.trim();
      if (city) {
        const key = `c:${city}:${r.state || ''}`;
        if (!seen.has(key)) {
          seen.add(key);
          opts.push({
            display: r.state ? `${city}, ${r.state}` : city,
            filterValue: city,
            type: 'city',
          });
        }
      }
      if (r.state) {
        const key = `s:${r.state}`;
        if (!seen.has(key)) {
          seen.add(key);
          opts.push({ display: r.state, filterValue: r.state, type: 'state' });
        }
      }
      if (r.zip) {
        const key = `z:${r.zip}`;
        if (!seen.has(key)) {
          seen.add(key);
          opts.push({ display: r.zip, filterValue: r.zip, type: 'zip' });
        }
      }
    });
    return opts.sort((a, b) => a.display.localeCompare(b.display));
  }, [restaurants]);

  const visibleLocationOptions = useMemo(() => {
    const q = locationSearch.trim().toLowerCase();
    if (!q) return locationOptions.slice(0, 8);
    return locationOptions.filter(o => o.display.toLowerCase().includes(q)).slice(0, 10);
  }, [locationSearch, locationOptions]);

  function selectLocation(option) {
    setCityFilter(option.filterValue);
    setLocationSearch(option.display);
    setShowLocationDropdown(false);
  }

  function clearLocation() {
    setCityFilter('All Cities');
    setLocationSearch('');
    setShowLocationDropdown(false);
  }

  const filtered = useMemo(() => restaurants.filter(r => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q ||
      r.name?.toLowerCase().includes(q) ||
      r.location?.toLowerCase().includes(q) ||
      r.city?.toLowerCase().includes(q) ||
      r.state?.toLowerCase().includes(q) ||
      r.zip?.includes(q) ||
      r.cuisine?.toLowerCase().includes(q);
    const matchesCuisine = cuisineFilter === 'All' || (cuisineFilter === 'Favourites' ? favourites.has(r.id) : r.cuisine?.toLowerCase().includes(cuisineFilter.toLowerCase()));
    const matchesCity = cityFilter === 'All Cities' ||
      r.city === cityFilter ||
      r.state === cityFilter ||
      r.zip === cityFilter ||
      r.location?.includes(cityFilter);
    const matchesOpen = !openNowFilter || ['open', 'closing'].includes(getOpenStatus(r.hours)?.status);
    const matchesHalalStandard = halalStandardFilter === 'All' || r.halalStandard === halalStandardFilter;
    return matchesSearch && matchesCuisine && matchesCity && matchesOpen && matchesHalalStandard;
  }), [restaurants, search, cuisineFilter, cityFilter, openNowFilter, favourites, halalStandardFilter]);

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
    const uniqueStates = [...new Set(restaurants.map(r => r.state).filter(Boolean))];
    const stateMatches = uniqueStates.filter(s => s.toLowerCase().includes(q)).slice(0, 2).map(s => ({ type: 'state', label: s }));
    const uniqueZips = [...new Set(restaurants.map(r => r.zip).filter(Boolean))];
    const zipMatches = uniqueZips.filter(z => z.includes(q)).slice(0, 2).map(z => ({ type: 'zip', label: z }));
    const uniqueCuisines = [...new Set(restaurants.map(r => r.cuisine).filter(Boolean))];
    const cuisineMatches = uniqueCuisines.filter(c => c.toLowerCase().includes(q)).slice(0, 2).map(c => ({ type: 'cuisine', label: c }));
    return [...names, ...stateMatches, ...cityMatches, ...zipMatches, ...cuisineMatches];
  }, [search, restaurants]);

  function handleSuggestionSelect(suggestion) {
    if (suggestion.type === 'restaurant') {
      setSearch('');
      setShowSuggestions(false);
      setTimeout(() => {
        document.getElementById(`restaurant-${suggestion.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    } else if (suggestion.type === 'state' || suggestion.type === 'city' || suggestion.type === 'zip') {
      setCityFilter(suggestion.label);
      setLocationSearch(suggestion.label);
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
    halalStandardFilter, setHalalStandardFilter,
    showAllCuisines, setShowAllCuisines,
    showSuggestions, setShowSuggestions,
    highlightedIdx, setHighlightedIdx,
    showInstallBanner, setShowInstallBanner,
    deferredPrompt,
    searchContainerRef,
    locationRef,
    locationSearch, setLocationSearch,
    showLocationDropdown, setShowLocationDropdown,
    visibleLocationOptions,
    selectLocation, clearLocation,
    filtered, sortedFiltered, suggestions,
    handleSuggestionSelect,
  };
}
