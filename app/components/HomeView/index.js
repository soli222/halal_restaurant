import Toast from '../Toast';
import { CUISINES, CUISINE_IMAGES, DEFAULT_FOOD_IMAGE } from '../../constants';
import { getOpenStatus, formatTime } from '../../utils/restaurant';

export default function HomeView({
  // Auth
  user, userRole, onboardingComplete,
  handleLogin, handleLogout,
  onStartOwnerOnboarding,
  onOwnerSignIn,
  // Navigation
  view, setView, selected, setSelected,
  // Toasts
  toasts,
  // Restaurants
  restaurants, loadingRestaurants, reviewStats,
  topRated, recentRestaurants,
  openRestaurant,
  favourites, toggleFavourite,
  // Search & filters
  search, setSearch,
  cuisineFilter, setCuisineFilter,
  cityFilter, setCityFilter,
  openNowFilter, setOpenNowFilter,
  sortBy, setSortBy,
  showAllCuisines, setShowAllCuisines,
  showSuggestions, setShowSuggestions,
  highlightedIdx, setHighlightedIdx,
  searchContainerRef,
  locationRef,
  locationSearch, setLocationSearch,
  showLocationDropdown, setShowLocationDropdown,
  visibleLocationOptions,
  selectLocation, clearLocation,
  sortedFiltered, suggestions,
  handleSuggestionSelect,
  // PWA
  showInstallBanner, setShowInstallBanner,
  deferredPrompt, setDeferredPrompt,
}) {
  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 relative overflow-x-hidden">
      {/* Ambient background glows + dot pattern */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <div className="absolute rounded-full" style={{ top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 500, background: 'radial-gradient(ellipse, rgba(34,197,94,0.10) 0%, transparent 65%)' }} />
        <div className="absolute rounded-full" style={{ top: '30%', left: '-10%', width: 550, height: 550, background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 65%)' }} />
        <div className="absolute rounded-full" style={{ bottom: '10%', right: '-10%', width: 650, height: 650, background: 'radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 65%)' }} />
      </div>

      <Toast toasts={toasts} />

      {/* Header */}
      <header className="bg-[#050505]/90 backdrop-blur-sm border-b border-white/[0.06] px-5 py-5 sticky top-0 z-10">
        <div className="max-w-[720px] mx-auto flex items-center justify-between">
          <button
            onClick={() => { setSelected(null); setView('home'); setSearch(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="text-xl font-bold text-white flex items-center gap-2 relative hover:opacity-80 transition-opacity"
          >
            <span className="absolute -inset-2 rounded-xl blur-xl bg-green-500/15 -z-10" />
            <span>☪️</span>
            <span>Halalgotos</span>
          </button>
          {user ? (
            <div className="flex items-center gap-3">
              {(view !== 'home' || !!selected) && (
                <button
                  onClick={() => { setSelected(null); setView('home'); setSearch(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="text-sm font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl transition-all duration-200"
                >
                  Home
                </button>
              )}
              {userRole === 'owner' && onboardingComplete && (
                <button
                  onClick={onOwnerSignIn}
                  className="text-sm font-semibold text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 px-3 py-1.5 rounded-xl transition-all duration-200"
                >
                  My Dashboard
                </button>
              )}
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full ring-2 ring-white/10" />
              <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition-all duration-200">
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="border border-green-500/60 text-green-400 hover:bg-green-500/10 active:scale-95 font-semibold px-5 py-2 rounded-full text-sm transition-all duration-200"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </header>

      <main className="relative z-10 max-w-[720px] mx-auto px-5 py-12 space-y-10">

        {/* Hero */}
        <div className="relative rounded-3xl overflow-hidden py-28 px-6 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-green-900/40 via-[#091409]/90 to-[#050505]" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(34,197,94,0.07) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-40 rounded-full blur-3xl" style={{ background: 'radial-gradient(ellipse, rgba(34,197,94,0.12) 0%, transparent 70%)' }} />
          <div className="relative space-y-4">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 text-green-400 text-xs font-semibold mb-2">
              ☪️ Trusted by the Muslim community
            </div>
            <h2 className="text-5xl sm:text-6xl font-extrabold text-white leading-tight tracking-tight">
              Find Halal Food<br />
              <span className="text-green-400 relative inline-block">
                <span className="absolute inset-0 blur-3xl bg-green-500/20 rounded-full scale-110 -z-10" />
                You Can Trust
              </span>
            </h2>
            <p className="text-[#9ca3af] text-base max-w-md mx-auto leading-relaxed mt-2">
              Real reviews from the Muslim community.<br />Only fully halal certified restaurants.
            </p>
          </div>
        </div>
        <div className="h-px w-full" style={{ background: 'linear-gradient(to right, transparent, rgba(34,197,94,0.3), transparent)', boxShadow: '0 0 8px rgba(34,197,94,0.2)' }} />

        {/* Informational sections — shown to customers and logged-out visitors only */}
        {!selected && (!user || userRole === 'customer') && (
          <div className="space-y-10">
            {/* Trust highlights — compact single row */}
            <div className="grid grid-cols-4 divide-x divide-white/[0.06] bg-[#111111] border border-white/[0.06] rounded-2xl overflow-hidden">
              {[
                { icon: '✅', label: 'Cert verified' },
                { icon: '🕌', label: 'Muslim community' },
                { icon: '🔒', label: 'Free for diners' },
                { icon: '🔄', label: 'Always up to date' },
              ].map(({ icon, label }) => (
                <div key={label} className="py-4 px-2 text-center">
                  <p className="text-xl">{icon}</p>
                  <p className="text-[10px] text-gray-400 mt-1.5 leading-tight">{label}</p>
                </div>
              ))}
            </div>

            {/* Owner CTA */}
            <div className="relative overflow-hidden rounded-3xl px-6 py-8 sm:py-10">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent rounded-3xl" />
              <div className="absolute inset-0 border border-amber-500/25 rounded-3xl" />
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.4), transparent 70%)' }} />
              <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="flex-1 space-y-3">
                  <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 rounded-full px-3 py-1">
                    <span className="text-xs">🏪</span>
                    <span className="text-xs font-semibold text-amber-400 tracking-wide">For Restaurant Owners</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                    Own a halal restaurant?<br />
                    <span className="text-amber-400">Get verified and listed.</span>
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
                    Join Halalgotos and reach thousands of Muslim diners actively looking for certified halal restaurants in your city. Verification takes less than 5 minutes.
                  </p>
                  <ul className="space-y-1.5">
                    {[
                      'Free 7-day trial — no card needed to start',
                      'Your listing reviewed within 7 business days',
                      'Respond to reviews and grow your reputation',
                    ].map(item => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-300">
                        <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-3 sm:items-center sm:flex-shrink-0">
                  <button
                    onClick={onStartOwnerOnboarding}
                    className="whitespace-nowrap bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-bold px-6 py-3.5 rounded-2xl text-sm transition-all duration-200 shadow-lg shadow-amber-500/25"
                  >
                    List my restaurant →
                  </button>
                  <button
                    onClick={onOwnerSignIn}
                    className="whitespace-nowrap text-sm font-medium text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/60 px-6 py-2.5 rounded-2xl transition-all duration-200"
                  >
                    Already listed? Sign in
                  </button>
                  <p className="text-xs text-gray-600 text-center">7 days free · Cancel anytime</p>
                </div>
              </div>
            </div>

            <div className="h-px w-full" style={{ background: 'linear-gradient(to right, transparent, rgba(34,197,94,0.2), transparent)' }} />
          </div>
        )}

        {/* Search bar + city filter */}
        <div className="flex gap-2">
          <div className="relative flex-1" ref={searchContainerRef}>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setShowSuggestions(true); setHighlightedIdx(-1); }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={e => {
                if (!showSuggestions || suggestions.length === 0) return;
                if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIdx(i => Math.min(i + 1, suggestions.length - 1)); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIdx(i => Math.max(i - 1, 0)); }
                else if (e.key === 'Enter' && highlightedIdx >= 0) { e.preventDefault(); handleSuggestionSelect(suggestions[highlightedIdx]); }
                else if (e.key === 'Escape') { setShowSuggestions(false); setHighlightedIdx(-1); }
              }}
              placeholder="Search halal restaurants, cuisines…"
              className="w-full bg-[#111111] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-green-500/40 focus:ring-2 focus:ring-green-500/10 transition-all duration-200 text-sm tracking-wide shadow-inner"
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#111111] border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl shadow-black/60">
                {[
                  { key: 'restaurant', groupLabel: 'Restaurants', icon: (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  )},
                  { key: 'state', groupLabel: 'States', icon: (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h1v11H4V10zm15 0h1v11h-1V10zm-7 0h1v11h-1V10z" /></svg>
                  )},
                  { key: 'city', groupLabel: 'Cities', icon: (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )},
                  { key: 'zip', groupLabel: 'ZIP Codes', icon: (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
                  )},
                  { key: 'cuisine', groupLabel: 'Cuisines', icon: (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                  )},
                ].map(({ key, groupLabel, icon }) => {
                  const group = suggestions.filter(s => s.type === key);
                  if (group.length === 0) return null;
                  return (
                    <div key={key}>
                      <div className="px-4 pt-2.5 pb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">{groupLabel}</div>
                      {group.map((s, gi) => {
                        const globalIdx = suggestions.indexOf(s);
                        return (
                          <button
                            key={gi}
                            onMouseDown={e => { e.preventDefault(); handleSuggestionSelect(s); }}
                            onMouseEnter={() => setHighlightedIdx(globalIdx)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors duration-100 ${highlightedIdx === globalIdx ? 'bg-green-500/10 text-green-300' : 'text-gray-300 hover:bg-white/5'}`}
                          >
                            <span className="text-gray-500">{icon}</span>
                            <span>{s.label}</span>
                            {key !== 'restaurant' && <span className="ml-auto text-[10px] text-gray-600">tap to filter</span>}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="relative flex-shrink-0 w-[160px]" ref={locationRef}>
            <div className="relative">
              <input
                type="text"
                value={locationSearch}
                onChange={e => { setLocationSearch(e.target.value); setShowLocationDropdown(true); }}
                onFocus={() => setShowLocationDropdown(true)}
                placeholder="All Locations"
                className="w-full bg-[#111111] border border-white/10 rounded-2xl px-3 py-4 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-green-500/40 transition-all duration-200 pr-8"
              />
              {locationSearch ? (
                <button
                  onClick={clearLocation}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors text-xs"
                >
                  ✕
                </button>
              ) : (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
              )}
            </div>
            {showLocationDropdown && visibleLocationOptions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#111111] border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl shadow-black/60 max-h-64 overflow-y-auto">
                {visibleLocationOptions.map((opt, i) => (
                  <button
                    key={i}
                    onMouseDown={e => { e.preventDefault(); selectLocation(opt); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <span className="text-gray-600 flex-shrink-0">
                      {opt.type === 'state' ? '🗺' : opt.type === 'zip' ? '#' : '📍'}
                    </span>
                    <span className="truncate">{opt.display}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
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
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all duration-200 flex items-center gap-1.5 ${
              openNowFilter ? 'bg-green-500 text-white shadow-md shadow-green-500/20' : 'bg-transparent text-gray-400 hover:text-gray-200 border border-white/[0.12] hover:border-white/30'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${openNowFilter ? 'bg-white' : 'bg-green-500'}`} />
            Open Now
          </button>
          <button
            onClick={() => setCuisineFilter(cuisineFilter === 'Favourites' ? 'All' : 'Favourites')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all duration-200 flex items-center gap-1.5 ${
              cuisineFilter === 'Favourites' ? 'bg-green-500 text-white shadow-md shadow-green-500/20' : 'bg-transparent text-gray-400 hover:text-gray-200 border border-white/[0.12] hover:border-white/30'
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
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all duration-200 ${
                cuisineFilter === c ? 'bg-green-500 text-white shadow-md shadow-green-500/20' : 'bg-transparent text-gray-400 hover:text-gray-200 border border-white/[0.12] hover:border-white/30'
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

        {/* Top Rated */}
        {topRated.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-bold text-white text-base flex items-center gap-2 tracking-wide">
              <span className="text-yellow-400">⭐</span> Top Rated
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
              {topRated.map(rest => (
                <button key={rest.id} onClick={() => openRestaurant(rest)} className="flex-shrink-0 w-44 bg-[#111111] rounded-2xl overflow-hidden border border-white/5 hover:border-green-500/20 hover:-translate-y-1 transition-all duration-200 text-left">
                  <div className="h-24 relative overflow-hidden">
                    <img src={rest.coverImageUrl || CUISINE_IMAGES[rest.cuisine] || DEFAULT_FOOD_IMAGE} alt={rest.name} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
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

        {/* Recently Viewed */}
        {recentRestaurants.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-bold text-white text-base flex items-center gap-2 tracking-wide">
              <span className="text-gray-400">🕐</span> Recently Viewed
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
              {recentRestaurants.map(rest => (
                <button key={rest.id} onClick={() => openRestaurant(rest)} className="flex-shrink-0 w-44 bg-[#111111] rounded-2xl overflow-hidden border border-white/5 hover:border-green-500/20 hover:-translate-y-1 transition-all duration-200 text-left">
                  <div className="h-24 relative overflow-hidden">
                    <img src={rest.coverImageUrl || CUISINE_IMAGES[rest.cuisine] || DEFAULT_FOOD_IMAGE} alt={rest.name} className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-white text-xs font-bold line-clamp-1">{rest.name}</p>
                    {rest.cuisine && <span className="text-[10px] text-green-400">{rest.cuisine}</span>}
                    <p className="text-[10px] text-gray-500 line-clamp-1">{rest.city || rest.location}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Divider + Sort */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />
          <span className="text-[10px] font-semibold text-green-500/40 tracking-widest uppercase flex-shrink-0">Restaurants</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="flex-shrink-0 bg-[#111111] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-400 focus:outline-none focus:border-green-500/40 cursor-pointer transition-all duration-200">
            <option value="default">Default</option>
            <option value="rating">Top Rated</option>
            <option value="most_reviewed">Most Reviewed</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        {/* Restaurant list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {loadingRestaurants ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-52 bg-white/5" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-white/5 rounded-full w-3/5" />
                  <div className="h-3 bg-white/5 rounded-full w-2/5" />
                </div>
              </div>
            ))
          ) : sortedFiltered.length === 0 ? (
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
                    <button onClick={() => setCuisineFilter('All')} className="text-sm text-green-400 hover:text-green-300 transition-colors">Clear cuisine filter</button>
                  )}
                  {openNowFilter && (
                    <button onClick={() => setOpenNowFilter(false)} className="text-sm text-green-400 hover:text-green-300 transition-colors">Clear "Open Now" filter</button>
                  )}
                </div>
              )}
            </div>
          ) : (
            sortedFiltered.map(rest => {
              const stats = reviewStats[rest.id];
              const openStatus = getOpenStatus(rest.hours);
              return (
                <div
                  key={rest.id}
                  id={`restaurant-${rest.id}`}
                  onClick={() => openRestaurant(rest)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && openRestaurant(rest)}
                  className="group bg-[#111111] rounded-2xl overflow-hidden border border-white/[0.06] hover:-translate-y-1.5 hover:border-green-500/20 transition-all duration-300 text-left w-full cursor-pointer"
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 20px rgba(34,197,94,0.1), 0 20px 60px rgba(0,0,0,0.5)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
                >
                  <div className="relative h-52 overflow-hidden bg-gradient-to-br from-green-950/60 via-[#0d1f0d] to-[#111111]">
                    <img
                      src={rest.coverImageUrl || CUISINE_IMAGES[rest.cuisine] || DEFAULT_FOOD_IMAGE}
                      alt={rest.cuisine || rest.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                      {rest.verifiedOwner ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/80 backdrop-blur-sm text-white">✓ Verified</span>
                      ) : <span />}
                      <button
                        onClick={e => toggleFavourite(e, rest.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all duration-200"
                        aria-label={favourites.has(rest.id) ? 'Remove from favourites' : 'Add to favourites'}
                      >
                        {favourites.has(rest.id) ? (
                          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-500/90 backdrop-blur-sm text-white">✓ Halal</span>
                    </div>
                    {openStatus && (() => {
                      const dotColor = openStatus.status === 'open' ? 'bg-green-400' : openStatus.status === 'closing' ? 'bg-yellow-400' : 'bg-gray-500';
                      const textColor = openStatus.status === 'open' ? 'text-green-300' : openStatus.status === 'closing' ? 'text-yellow-300' : 'text-gray-400';
                      return (
                        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                          <span className={`text-[10px] font-semibold ${textColor}`}>
                            {openStatus.status === 'open' ? 'Open' : openStatus.status === 'closing' ? 'Closing' : 'Closed'}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="p-4 space-y-2.5">
                    <h3 className="font-bold text-white text-base leading-snug line-clamp-1">{rest.name}</h3>
                    {stats ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map(i => (
                            <svg key={i} className={`w-3.5 h-3.5 ${i <= Math.round(stats.avg) ? 'text-yellow-400' : 'text-gray-700'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm font-bold text-white">{stats.avg}</span>
                        <span className="text-xs text-gray-500">({stats.count} review{stats.count !== 1 ? 's' : ''})</span>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-600">No reviews yet</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {rest.cuisine && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{rest.cuisine}</span>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-500 min-w-0">
                        <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="truncate">{rest.city || rest.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] mt-16 px-5 py-6">
        <div className="max-w-[720px] mx-auto flex flex-col items-center gap-2 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} Halalgotos. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="/faq" className="hover:text-gray-400 transition-colors">FAQ</a>
            <a href="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-gray-400 transition-colors">Terms of Use</a>
          </div>
        </div>
      </footer>

      {/* PWA install banner */}
      {showInstallBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#111111] border-t border-white/10 px-4 py-4 flex items-center justify-between gap-3 sm:hidden">
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold">Install Halalgotos</p>
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
