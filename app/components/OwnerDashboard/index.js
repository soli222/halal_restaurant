import Toast from '../Toast';
import { DAYS } from '../../constants';

const RATING_LABELS = {
  recommended:     { label: 'Highly Recommended', style: 'bg-green-500/15 border-green-500/25 text-green-400' },
  good:            { label: 'Good',                style: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400' },
  average:         { label: 'Average',             style: 'bg-yellow-500/15 border-yellow-500/25 text-yellow-400' },
  not_recommended: { label: 'Not Recommended',     style: 'bg-red-500/15 border-red-500/25 text-red-400' },
};

export default function OwnerDashboard({
  user,
  toasts,
  subscription,
  isSubscribed,
  isPro,
  verificationRequest,
  linkedRestaurant,
  dashboardReviews,
  loadingDashboard,
  savingProfile,
  editDescription, setEditDescription,
  editHours, setEditHours,
  editWebsiteUrl, setEditWebsiteUrl,
  editMapsUrl, setEditMapsUrl,
  coverImagePreview,
  handleCoverChange,
  saveProfile,
  handleLogout,
  setView,
  handleSubscribe,
  loadingSub,
}) {
  const status = verificationRequest?.status;

  const certExpiry = verificationRequest?.certExpiryDate;
  const certDaysLeft = certExpiry
    ? Math.floor((new Date(certExpiry) - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const certColor = certDaysLeft === null ? 'text-gray-400'
    : certDaysLeft < 0 ? 'text-red-400'
    : certDaysLeft < 30 ? 'text-yellow-400'
    : 'text-green-400';

  function updateHour(key, field, value) {
    setEditHours(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  function toggleClosed(key) {
    setEditHours(prev => ({ ...prev, [key]: { ...prev[key], closed: !prev[key].closed } }));
  }

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 relative overflow-x-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        <div className="absolute rounded-full" style={{ top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 500, background: 'radial-gradient(ellipse, rgba(251,191,36,0.08) 0%, transparent 65%)' }} />
        <div className="absolute rounded-full" style={{ top: '40%', right: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 65%)' }} />
      </div>

      <Toast toasts={toasts} />

      {/* Header */}
      <header className="bg-[#050505]/90 backdrop-blur-sm border-b border-white/[0.06] px-5 py-5 sticky top-0 z-10">
        <div className="max-w-[720px] mx-auto flex items-center justify-between">
          <button
            onClick={() => setView('home')}
            className="text-xl font-bold text-white flex items-center gap-2 relative hover:opacity-80 transition-opacity"
          >
            <span className="absolute -inset-2 rounded-xl blur-xl bg-amber-500/10 -z-10" />
            <span>☪️</span>
            <span>HalalSpot</span>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full">
              Owner Dashboard
            </span>
            {user?.photoURL && (
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full ring-2 ring-white/10" />
            )}
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition-all duration-200">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-[720px] mx-auto px-5 py-10 space-y-6">

        {loadingDashboard ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#111111] border border-white/[0.06] rounded-2xl animate-pulse" style={{ height: i === 1 ? 120 : i === 2 ? 400 : 160 }} />
            ))}
          </div>
        ) : (
          <>
            {/* Welcome + Status */}
            <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-lg font-bold text-white">
                    Welcome back{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
                  </h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {verificationRequest?.businessName || 'Your restaurant dashboard'}
                  </p>
                </div>
                {status === 'approved' && (
                  <span className="flex-shrink-0 text-xs font-semibold bg-green-500/15 border border-green-500/30 text-green-400 px-3 py-1.5 rounded-full">✓ Verified &amp; Live</span>
                )}
                {status === 'pending' && (
                  <span className="flex-shrink-0 text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-full">⏳ Under Review</span>
                )}
                {status === 'rejected' && (
                  <span className="flex-shrink-0 text-xs font-semibold bg-red-500/15 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-full">✗ Rejected</span>
                )}
                {!status && (
                  <span className="flex-shrink-0 text-xs font-semibold bg-white/5 border border-white/10 text-gray-500 px-3 py-1.5 rounded-full">No submission</span>
                )}
              </div>

              {status === 'pending' && (
                <p className="text-sm text-gray-400 bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3">
                  Your verification is under review. Our team will approve your listing within 1–2 business days. You can update your profile below in the meantime.
                </p>
              )}
              {status === 'rejected' && (
                <p className="text-sm text-gray-400 bg-red-500/5 border border-red-500/15 rounded-xl px-4 py-3">
                  Your verification was rejected. Please contact us at <span className="text-red-400">support@halalspot.com</span> for more information.
                </p>
              )}
              {!verificationRequest && (
                <p className="text-sm text-gray-400 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  No verification submission found.{' '}
                  <button onClick={() => setView('home')} className="text-amber-400 hover:underline">
                    Return to home
                  </button>{' '}
                  and click "List my restaurant" to register.
                </p>
              )}
            </div>

            {verificationRequest && (
              <>
                {/* Business info (read-only) */}
                <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-6 space-y-4">
                  <h2 className="text-sm font-semibold text-white">Business information</h2>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                    {[
                      { label: 'Business name', value: verificationRequest.businessName },
                      { label: 'City', value: verificationRequest.ownerCity },
                      { label: 'Cuisine', value: verificationRequest.cuisineType },
                      { label: 'Certifying body', value: verificationRequest.certifyingBody },
                      { label: 'Cert number', value: verificationRequest.certificationNumber },
                      {
                        label: 'Cert expiry',
                        value: verificationRequest.certExpiryDate,
                        extra: certDaysLeft !== null
                          ? certDaysLeft < 0 ? ' (expired)' : ` (${certDaysLeft}d left)`
                          : '',
                        className: certColor,
                      },
                    ].filter(r => r.value).map(({ label, value, extra, className }) => (
                      <div key={label}>
                        <p className="text-[11px] text-gray-600 uppercase tracking-wide mb-0.5">{label}</p>
                        <p className={`text-sm font-medium ${className || 'text-white'}`}>
                          {value}{extra || ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Editable profile */}
                <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-6 space-y-6">
                  <h2 className="text-sm font-semibold text-white">Edit your public profile</h2>

                  {/* Cover photo */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 uppercase tracking-wide">Cover photo</label>
                    {coverImagePreview && (
                      <img
                        src={coverImagePreview}
                        alt="Cover"
                        className="h-44 w-full object-cover rounded-xl border border-white/10 mb-2"
                      />
                    )}
                    <label className="flex items-center gap-2 cursor-pointer group w-fit">
                      <div className="flex items-center gap-2 bg-[#1A1A1A] border border-white/10 hover:border-amber-500/30 rounded-xl px-4 py-2.5 transition-all duration-200">
                        <svg className="w-4 h-4 text-gray-500 group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
                          {coverImagePreview ? 'Change cover photo' : 'Upload cover photo'}
                        </span>
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                    </label>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-500 uppercase tracking-wide">Description</label>
                    <textarea
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      placeholder="Describe your restaurant — cuisine style, atmosphere, specialities…"
                      rows={3}
                      className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all duration-200 resize-none"
                    />
                  </div>

                  {/* Business hours */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 uppercase tracking-wide">Business hours</label>
                    <div className="space-y-1.5">
                      {DAYS.map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-8 flex-shrink-0">{label}</span>
                          {editHours[key]?.closed ? (
                            <span className="flex-1 text-xs text-gray-600 italic">Closed</span>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-1">
                              <input
                                type="time"
                                value={editHours[key]?.open || '11:00'}
                                onChange={e => updateHour(key, 'open', e.target.value)}
                                className="bg-[#1A1A1A] border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-amber-500/40 w-24"
                              />
                              <span className="text-gray-600 text-xs">–</span>
                              <input
                                type="time"
                                value={editHours[key]?.close || '22:00'}
                                onChange={e => updateHour(key, 'close', e.target.value)}
                                className="bg-[#1A1A1A] border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-amber-500/40 w-24"
                              />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => toggleClosed(key)}
                            className={`text-[10px] font-medium px-2 py-1 rounded-lg transition-all duration-200 flex-shrink-0 ${
                              editHours[key]?.closed
                                ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                                : 'bg-white/5 text-gray-500 border border-white/10 hover:text-gray-300'
                            }`}
                          >
                            {editHours[key]?.closed ? 'Closed' : 'Set closed'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Website + Maps */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Website URL</label>
                      <input
                        type="url"
                        value={editWebsiteUrl}
                        onChange={e => setEditWebsiteUrl(e.target.value)}
                        placeholder="https://yourrestaurant.com"
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Google Maps URL</label>
                      <input
                        type="url"
                        value={editMapsUrl}
                        onChange={e => setEditMapsUrl(e.target.value)}
                        placeholder="https://maps.google.com/…"
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <button
                    onClick={saveProfile}
                    disabled={savingProfile}
                    className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-bold px-6 py-3 rounded-2xl text-sm transition-all duration-200 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingProfile ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </>
            )}

            {/* Subscription */}
            <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Subscription</h2>
                {isPro ? (
                  <span className="text-xs font-bold bg-green-500/15 border border-green-500/30 text-green-400 px-3 py-1 rounded-full">Pro</span>
                ) : isSubscribed ? (
                  <span className="text-xs font-bold bg-white/10 border border-white/10 text-gray-300 px-3 py-1 rounded-full">Basic</span>
                ) : (
                  <span className="text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full">No plan</span>
                )}
              </div>

              {subscription?.status === 'trialing' && (
                <p className="text-sm text-gray-400">🎁 Free trial active — no charge until your trial ends.</p>
              )}
              {subscription?.status === 'active' && (
                <p className="text-sm text-gray-400">
                  Active — {subscription.plan === 'pro' ? 'Pro' : 'Basic'} plan at ${((subscription.amount || 0) / 100).toFixed(0)}/mo
                </p>
              )}
              {!isSubscribed && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">Subscribe to get your restaurant listed and respond to reviews.</p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleSubscribe('basic')}
                      disabled={loadingSub}
                      className="text-sm font-semibold text-white bg-white/10 hover:bg-white/20 active:scale-95 px-5 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50"
                    >
                      {loadingSub ? 'Redirecting…' : 'Basic — $30/mo'}
                    </button>
                    <button
                      onClick={() => handleSubscribe('pro')}
                      disabled={loadingSub}
                      className="text-sm font-semibold text-white bg-green-500 hover:bg-green-600 active:scale-95 px-5 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-green-500/20 disabled:opacity-50"
                    >
                      {loadingSub ? 'Redirecting…' : 'Pro — $40/mo'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Recent reviews */}
            {dashboardReviews.length > 0 && (
              <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-6 space-y-4">
                <h2 className="text-sm font-semibold text-white">
                  Recent reviews
                  {linkedRestaurant?.name && (
                    <span className="ml-2 font-normal text-gray-500">— {linkedRestaurant.name}</span>
                  )}
                </h2>
                <div className="space-y-3">
                  {dashboardReviews.map(review => {
                    const r = RATING_LABELS[review.rating] || { label: review.rating, style: 'bg-white/10 border-white/10 text-gray-300' };
                    return (
                      <div key={review.id} className="bg-[#0D0D0D] border border-white/[0.06] rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${r.style}`}>
                            {r.label}
                          </span>
                          {review.createdAt?.toDate && (
                            <span className="text-xs text-gray-600">
                              {new Date(review.createdAt.toDate()).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {review.text && (
                          <p className="text-sm text-gray-300 leading-relaxed line-clamp-3">{review.text}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </>
        )}
      </main>
    </div>
  );
}
