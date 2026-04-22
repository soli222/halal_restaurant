import dynamic from 'next/dynamic';
import Toast from './Toast';
import { RATING_OPTIONS, RATING_STYLES, DAYS } from '../constants';
import { getOpenStatus, formatTime, certExpiryStatus } from '../utils/restaurant';

const RestaurantLocationMap = dynamic(() => import('./RestaurantLocationMap'), { ssr: false });

export default function RestaurantDetailView({
  selected,
  toasts,
  user,
  handleLogin,
  handleLogout,
  setView,
  userRole,
  isSubscribed,
  isPro,
  reviews,
  reviewText, setReviewText,
  rating, setRating,
  photo, photoPreview,
  submitting,
  aiSummary, loadingSummary,
  advancedSummary, loadingAdvanced,
  certVisible, setCertVisible,
  familyFriendly, setFamilyFriendly,
  replyingTo, setReplyingTo,
  replyText, setReplyText,
  submittingReply,
  isListening, speechSupported,
  handlePhotoChange,
  toggleListening,
  submitReview,
  submitReply,
  generateSummary,
  generateAdvancedSummary,
  shareRestaurant,
  getAnalytics,
  ratingCount,
}) {
  const subscribed = isSubscribed();
  const pro = isPro();
  const analytics = subscribed ? getAnalytics() : null;
  const maxDayCount = analytics ? Math.max(...analytics.days.map(d => d.count), 1) : 1;

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 relative overflow-x-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <div className="absolute rounded-full" style={{ top: '-5%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(34,197,94,0.08) 0%, transparent 65%)' }} />
        <div className="absolute rounded-full" style={{ bottom: '15%', right: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 65%)' }} />
      </div>

      <Toast toasts={toasts} />

      {/* Header */}
      <header className="bg-[#050505]/90 backdrop-blur-sm border-b border-white/[0.06] px-5 py-4 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={() => setView('home')}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <span className="font-semibold text-white truncate max-w-[160px]">{selected.name}</span>
        {user ? (
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition-all duration-200">
            Sign out
          </button>
        ) : (
          <button onClick={handleLogin} className="text-sm font-medium text-green-400 hover:text-green-300 transition-all duration-200">
            Sign in
          </button>
        )}
      </header>

      {/* Restaurant hero banner */}
      <div className="relative overflow-hidden" style={{ minHeight: '220px' }}>
        {selected.coverImageUrl ? (
          <img src={selected.coverImageUrl} alt={selected.name} className="w-full h-56 object-cover" />
        ) : (
          <div className="w-full h-56 bg-gradient-to-br from-green-950/70 via-[#091409] to-[#0A0A0A] flex items-center justify-center overflow-hidden">
            <span className="text-[140px] font-black text-green-500/10 select-none leading-none">
              {selected.name?.[0]?.toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent" />
        {/* Cert badge overlay */}
        <div className="absolute top-4 right-4">
          {(() => {
            const status = certExpiryStatus(selected.certExpiryDate);
            if (status === 'expired') return <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500/80 text-white">⚠ Cert Expired</span>;
            if (status === 'expiring') return <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-yellow-500/80 text-black">⚠ Expiring Soon</span>;
            return <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-500 text-white">✓ Halal Certified</span>;
          })()}
        </div>
        {/* Restaurant info over gradient */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-5">
          <div className="flex items-end justify-between gap-2">
            <h1 className="text-2xl font-extrabold text-white leading-tight">{selected.name}</h1>
            <button
              onClick={shareRestaurant}
              className="flex-shrink-0 p-2 rounded-xl bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all duration-200 mb-0.5"
              title="Share restaurant"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-gray-400 text-sm flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {selected.location}
            </span>
            {selected.cuisine && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/25">{selected.cuisine}</span>
            )}
            {selected.certifyingBody && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300 border border-white/15">{selected.certifyingBody}</span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[720px] mx-auto px-5 py-6 space-y-5">

        {/* Community stats + rating counts */}
        <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 space-y-4">
          {(selected.certificationNumber || selected.certExpiryDate) && (
            <div className="flex flex-wrap gap-2">
              {selected.certificationNumber && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10">
                  #{selected.certificationNumber}
                </span>
              )}
              {selected.certExpiryDate && (() => {
                const status = certExpiryStatus(selected.certExpiryDate);
                const colorClass = status === 'expired'
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : status === 'expiring'
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                  : 'bg-green-500/10 text-green-400 border-green-500/20';
                return (
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${colorClass}`}>
                    Expires {new Date(selected.certExpiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                );
              })()}
            </div>
          )}
          {reviews.length > 0 && (() => {
            const cvCount = reviews.filter(r => r.certVisible === true).length;
            const cvTotal = reviews.filter(r => r.certVisible !== null && r.certVisible !== undefined).length;
            const ffCount = reviews.filter(r => r.familyFriendly === true).length;
            const ffTotal = reviews.filter(r => r.familyFriendly !== null && r.familyFriendly !== undefined).length;
            return (cvTotal > 0 || ffTotal > 0) ? (
              <div className="flex flex-wrap gap-2">
                {cvTotal > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/15">
                    🏷 Cert visible: {Math.round((cvCount / cvTotal) * 100)}%
                  </span>
                )}
                {ffTotal > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/15">
                    👨‍👩‍👧 Family-friendly: {Math.round((ffCount / ffTotal) * 100)}%
                  </span>
                )}
              </div>
            ) : null;
          })()}
          <div className="flex flex-wrap gap-2">
            {RATING_OPTIONS.map(opt => (
              <span key={opt.value} className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${RATING_STYLES[opt.value].pill}`}>
                {opt.label}
                <span className="font-bold">{ratingCount(opt.value)}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Business hours */}
        {selected.hours && (
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Hours
              </h2>
              {(() => {
                const s = getOpenStatus(selected.hours);
                if (!s) return null;
                const styles = {
                  open:    'bg-green-500/15 text-green-400 border-green-500/25',
                  closing: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
                  closed:  'bg-white/5 text-gray-500 border-white/10',
                };
                return (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${styles[s.status]}`}>
                    {s.label}
                  </span>
                );
              })()}
            </div>
            <div className="space-y-2">
              {(() => {
                const todayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()];
                return DAYS.map(({ key, label }) => {
                  const day = selected.hours[key];
                  const isToday = key === todayKey;
                  return (
                    <div key={key} className={`flex items-center justify-between py-1.5 ${isToday ? 'text-white' : 'text-gray-500'}`}>
                      <span className={`text-xs font-medium w-8 ${isToday ? 'text-green-400' : ''}`}>{label}</span>
                      {!day || day.closed ? (
                        <span className="text-xs text-gray-600">Closed</span>
                      ) : (
                        <span className="text-xs">{formatTime(day.open)} – {formatTime(day.close)}</span>
                      )}
                      {isToday && <div className="w-1.5 h-1.5 rounded-full bg-green-500 ml-2 flex-shrink-0" />}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Location map */}
        <RestaurantLocationMap restaurant={selected} />

        {/* Analytics dashboard — Pro subscribers */}
        {subscribed && (
          <div className="relative">
            {pro ? (
              <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 space-y-5">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Analytics
                  <span className="ml-auto text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full border border-green-500/25">Pro</span>
                </h2>
                <div className="flex items-center justify-between bg-[#1A1A1A] rounded-xl px-4 py-3">
                  <span className="text-sm text-gray-400">Total reviews</span>
                  <span className="text-2xl font-bold text-white">{analytics.total}</span>
                </div>
                <div className="space-y-2.5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rating breakdown</p>
                  {RATING_OPTIONS.map(opt => {
                    const count = analytics[opt.value];
                    const pct = analytics.total > 0 ? (count / analytics.total) * 100 : 0;
                    return (
                      <div key={opt.value} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-20 flex-shrink-0">{opt.label}</span>
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${RATING_STYLES[opt.value].bar} transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 w-6 text-right flex-shrink-0">{count}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Weekly trend</p>
                    <p className="text-xs text-gray-500">
                      This week: <span className="text-white font-medium">{analytics.thisWeek}</span>
                      <span className="mx-1.5 text-gray-700">·</span>
                      Last week: <span className="text-white font-medium">{analytics.lastWeek}</span>
                    </p>
                  </div>
                  <div className="flex items-end gap-1 h-12">
                    {analytics.days.map((day, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex items-end justify-center" style={{ height: '40px' }}>
                          <div
                            className="w-full rounded-t bg-green-500/40 hover:bg-green-500/70 transition-colors duration-200"
                            style={{ height: `${(day.count / maxDayCount) * 40}px`, minHeight: day.count > 0 ? '3px' : '0' }}
                            title={`${day.label}: ${day.count}`}
                          />
                        </div>
                        <span className="text-[10px] text-gray-600">{day.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden">
                <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 space-y-5 select-none pointer-events-none" style={{ filter: 'blur(4px)' }}>
                  <h2 className="text-sm font-semibold text-white">Analytics</h2>
                  <div className="flex items-center justify-between bg-[#1A1A1A] rounded-xl px-4 py-3">
                    <span className="text-sm text-gray-400">Total reviews</span>
                    <span className="text-2xl font-bold text-white">—</span>
                  </div>
                  <div className="space-y-2.5">
                    {RATING_OPTIONS.map(opt => (
                      <div key={opt.value} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-20">{opt.label}</span>
                        <div className="flex-1 h-2 bg-white/5 rounded-full" />
                        <span className="text-xs text-gray-500 w-6">0</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0A0A]/60 rounded-2xl p-6 text-center">
                  <div className="w-10 h-10 bg-green-500/15 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="text-white font-semibold text-sm mb-1">Analytics is a Pro feature</p>
                  <p className="text-gray-500 text-xs mb-4">Upgrade to unlock rating breakdowns and weekly trends.</p>
                  <button
                    onClick={() => setView('pricing')}
                    className="bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-green-500/20"
                  >
                    Upgrade to Pro — $40/mo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Basic AI Summary */}
        <div className="bg-[#111111] rounded-2xl p-5 border border-green-500/20 shadow-[0_0_24px_rgba(34,197,94,0.06)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-green-400 flex items-center gap-2">✨ AI Summary</span>
            <button
              onClick={generateSummary}
              disabled={loadingSummary}
              className="text-xs bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold px-4 py-1.5 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingSummary ? 'Generating...' : 'Generate'}
            </button>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            {aiSummary || 'Click Generate to get an AI-powered summary of all reviews for this restaurant.'}
          </p>
        </div>

        {/* Advanced AI Insights — Pro subscribers */}
        {subscribed && (
          <div className="relative">
            {pro ? (
              <div className="bg-[#111111] rounded-2xl p-5 border border-green-500/30 shadow-[0_0_24px_rgba(34,197,94,0.08)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-green-400 flex items-center gap-2">
                    🔬 Advanced AI Insights
                    <span className="text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full border border-green-500/25">Pro</span>
                  </span>
                  <button
                    onClick={generateAdvancedSummary}
                    disabled={loadingAdvanced}
                    className="text-xs bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold px-4 py-1.5 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingAdvanced ? 'Analyzing...' : 'Analyze'}
                  </button>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                  {advancedSummary || 'Click Analyze for a detailed breakdown: sentiment score, top praised items, complaints, and a recommendation.'}
                </p>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden">
                <div className="bg-[#111111] rounded-2xl p-5 border border-green-500/20 space-y-2 select-none pointer-events-none" style={{ filter: 'blur(4px)' }}>
                  <span className="text-sm font-semibold text-green-400">🔬 Advanced AI Insights</span>
                  <p className="text-gray-400 text-sm">Sentiment score: —/10</p>
                  <p className="text-gray-600 text-xs">Top praised: ████████ ██████ ████</p>
                  <p className="text-gray-600 text-xs">Top complaints: ██████ ████████</p>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0A0A0A]/60 rounded-2xl p-6 text-center">
                  <div className="w-10 h-10 bg-green-500/15 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="text-white font-semibold text-sm mb-1">Advanced AI Insights is a Pro feature</p>
                  <p className="text-gray-500 text-xs mb-4">Get sentiment scores, top praised items, complaints, and actionable recommendations.</p>
                  <button
                    onClick={() => setView('pricing')}
                    className="bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-green-500/20"
                  >
                    Upgrade to Pro — $40/mo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Leave a review */}
        {user ? (
          <div className="bg-[#111111] rounded-2xl p-5 border border-white/5 space-y-4">
            <h2 className="font-semibold text-white">Leave a review</h2>
            <div className="flex gap-2">
              {RATING_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setRating(opt.value)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    rating === opt.value
                      ? RATING_STYLES[opt.value].selected
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <textarea
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
                className="w-full bg-[#1A1A1A] rounded-xl px-4 py-3 pr-12 text-sm text-gray-100 placeholder-gray-600 border border-white/10 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 resize-none transition-all duration-200"
              />
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  title={isListening ? 'Stop listening' : 'Dictate your review'}
                  className={`absolute right-2.5 top-2.5 p-1.5 rounded-lg transition-all duration-200 ${
                    isListening ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'text-gray-500 hover:text-green-400 hover:bg-white/5'
                  }`}
                >
                  {isListening ? (
                    <span className="flex items-center gap-1 text-xs font-medium px-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      Listening
                    </span>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>
              )}
            </div>

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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer hover:text-green-400 transition-all duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {photoPreview ? 'Photo added ✓' : 'Add photo (optional)'}
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
              <button
                onClick={submitReview}
                disabled={submitting}
                className="bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Posting...' : 'Post Review'}
              </button>
            </div>
            {photoPreview && (
              <img src={photoPreview} alt="preview" className="h-28 rounded-xl object-cover border border-white/10" />
            )}
          </div>
        ) : (
          <div className="bg-[#111111] rounded-2xl p-8 border border-white/5 text-center">
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm mb-4">Sign in to share your experience</p>
            <button
              onClick={handleLogin}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all duration-200"
            >
              Sign in with Google
            </button>
          </div>
        )}

        {/* Reviews list */}
        <div className="space-y-3">
          <h2 className="font-semibold text-white text-lg">Reviews ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <div className="bg-[#111111] border border-white/5 rounded-2xl p-12 text-center">
              <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-400 font-medium">No reviews yet</p>
              <p className="text-gray-600 text-sm mt-1">Be the first from the community to review this place!</p>
            </div>
          ) : (
            reviews.map(r => {
              const opt = RATING_OPTIONS.find(o => o.value === r.rating);
              const rStyle = RATING_STYLES[r.rating] || RATING_STYLES.good;
              return (
                <div
                  key={r.id}
                  className={`bg-[#141414] rounded-2xl p-4 border border-white/5 border-l-[3px] ${rStyle.leftBorder} transition-all duration-200`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      {r.userPhoto ? (
                        <img src={r.userPhoto} alt="" className="w-9 h-9 rounded-full ring-2 ring-white/10 flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold ring-2 ring-white/10 flex-shrink-0">
                          {r.userName?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium text-white">{r.userName}</span>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${rStyle.pill}`}>{opt?.label}</span>
                    </div>
                    {r.createdAt && (
                      <span className="text-xs text-gray-600 flex-shrink-0">
                        {r.createdAt?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed pl-10">{r.text}</p>
                  {r.photoUrl && (
                    <img src={r.photoUrl} alt="Review photo" className="mt-2 ml-10 rounded-xl object-cover border border-white/10 max-h-48 w-auto max-w-[calc(100%-2.5rem)]" />
                  )}
                  {((r.certVisible !== null && r.certVisible !== undefined) || (r.familyFriendly !== null && r.familyFriendly !== undefined)) && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pl-10">
                      {r.certVisible !== null && r.certVisible !== undefined && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${r.certVisible ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                          {r.certVisible ? '🏷 Cert visible' : '🏷 Cert not visible'}
                        </span>
                      )}
                      {r.familyFriendly !== null && r.familyFriendly !== undefined && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${r.familyFriendly ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                          {r.familyFriendly ? '👨‍👩‍👧 Family-friendly' : '👨‍👩‍👧 Not family-friendly'}
                        </span>
                      )}
                    </div>
                  )}
                  {r.reply && (
                    <div className="mt-3 ml-10 bg-[#1a1a1a] border-l-2 border-green-500/40 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25">🏪 Owner reply</span>
                        <span className="text-xs text-gray-500">{r.reply.userName}</span>
                      </div>
                      <p className="text-gray-300 text-xs leading-relaxed">{r.reply.text}</p>
                    </div>
                  )}
                  {userRole === 'owner' && !r.reply && replyingTo !== r.id && (
                    <div className="mt-2 pl-10">
                      <button
                        onClick={() => { setReplyingTo(r.id); setReplyText(''); }}
                        className="text-xs text-green-400/70 hover:text-green-400 transition-colors duration-200"
                      >
                        Reply
                      </button>
                    </div>
                  )}
                  {replyingTo === r.id && (
                    <div className="mt-3 ml-10 space-y-2">
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Write your reply..."
                        rows={2}
                        className="w-full bg-[#1A1A1A] rounded-xl px-3 py-2 text-xs text-gray-100 placeholder-gray-600 border border-white/10 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 resize-none transition-all duration-200"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => submitReply(r.id)}
                          disabled={submittingReply}
                          className="bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingReply ? 'Posting...' : 'Post'}
                        </button>
                        <button
                          onClick={() => { setReplyingTo(null); setReplyText(''); }}
                          disabled={submittingReply}
                          className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
