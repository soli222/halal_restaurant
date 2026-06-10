import { useState } from 'react';
import Toast from '../Toast';
import { DAYS, HALAL_STANDARDS } from '../../constants';

const RATING_LABELS = {
  recommended:     { label: 'Excellent', style: 'bg-green-500/15 border-green-500/25 text-green-400' },
  good:            { label: 'Good',                style: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400' },
  average:         { label: 'Average',             style: 'bg-yellow-500/15 border-yellow-500/25 text-yellow-400' },
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
  editPhone, setEditPhone,
  coverImagePreview,
  moderatingCover = false,
  handleCoverChange,
  galleryPhotos = [],
  uploadingGallery = false,
  handleGalleryAdd,
  handleGalleryRemove,
  saveProfile,
  handleLogout,
  setView,
  handleSubscribe,
  handleUpgrade,
  handleCancel,
  loadingSub,
  upgradingToPro,
  cancellingSubscription = false,
  notifications = [],
  unreadCount = 0,
  markAllRead,
  analyticsStats,
  allLinkedRestaurants = [],
  activeIndex = 0,
  onSwitchRestaurant,
  onAddRestaurant,
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
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
            <span>Halalgotos</span>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full">
              Owner Dashboard
            </span>
            {/* Notifications bell */}
            <button
              onClick={() => { setShowNotifications(v => !v); if (!showNotifications) markAllRead?.(); }}
              className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              title="Notifications"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {user?.photoURL && (
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full ring-2 ring-white/10" />
            )}
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition-all duration-200">
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Notifications panel */}
      {showNotifications && (
        <div className="relative z-20 max-w-[720px] mx-auto px-5 pt-4">
          <div className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <span className="text-sm font-semibold text-white">Notifications</span>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-xs text-gray-500 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
            {notifications.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-500">No notifications yet</div>
            ) : (
              <div className="divide-y divide-white/[0.04] max-h-72 overflow-y-auto">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`px-5 py-3.5 flex items-start gap-3 ${!n.read ? 'bg-amber-500/5' : ''}`}
                  >
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                      n.type === 'verification_approved' ? 'bg-green-400' :
                      n.type === 'verification_rejected' ? 'bg-red-400' :
                      'bg-amber-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 leading-snug">{n.message}</p>
                      {n.createdAt && (
                        <p className="text-xs text-gray-600 mt-0.5">
                          {n.createdAt?.toDate?.()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) ?? ''}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <main className="relative z-10 max-w-[720px] mx-auto px-5 py-10 space-y-6">

        {loadingDashboard ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#111111] border border-white/[0.06] rounded-2xl animate-pulse" style={{ height: i === 1 ? 120 : i === 2 ? 400 : 160 }} />
            ))}
          </div>
        ) : (
          <>
            {/* Restaurant switcher — shown when owner has multiple listings */}
            {allLinkedRestaurants.length > 1 && (
              <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">My Restaurants</h2>
                  <button
                    onClick={onAddRestaurant}
                    className="text-xs font-medium text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/60 px-3 py-1.5 rounded-xl transition-all duration-200"
                  >
                    + Add another
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allLinkedRestaurants.map((rest, i) => (
                    <button
                      key={i}
                      onClick={() => onSwitchRestaurant?.(i)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        i === activeIndex
                          ? 'bg-amber-500 text-black'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                      }`}
                    >
                      {rest?.name || `Restaurant ${i + 1}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                  Your verification is under review. Our team will approve your listing within 7 business days. You can update your profile below in the meantime.
                </p>
              )}
              {status === 'rejected' && (
                <p className="text-sm text-gray-400 bg-red-500/5 border border-red-500/15 rounded-xl px-4 py-3">
                  Your verification was rejected. Please contact us at <span className="text-red-400">halalgotos@gmail.com</span> for more information.
                </p>
              )}
              {certDaysLeft !== null && certDaysLeft < 30 && (
                <p className={`text-sm bg-opacity-5 border rounded-xl px-4 py-3 ${certDaysLeft < 0 ? 'text-red-400 bg-red-500/5 border-red-500/15' : 'text-yellow-400 bg-yellow-500/5 border-yellow-500/15'}`}>
                  {certDaysLeft < 0
                    ? '⚠ Your halal certificate has expired. Please renew your certification and contact us to update your listing.'
                    : `⚠ Your halal certificate expires in ${certDaysLeft} day${certDaysLeft === 1 ? '' : 's'}. Please renew it soon to keep your listing active.`}
                </p>
              )}
              {!verificationRequest && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🏪</span>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-amber-400">You haven't listed your restaurant yet</p>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        To access your full dashboard — including your public listing, reviews, and profile settings — you need to complete the restaurant registration process first.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">What happens during registration:</p>
                    <ul className="space-y-1.5">
                      {[
                        'Enter your restaurant details (name, city, cuisine type)',
                        'Submit your halal certification for verification',
                        'Upload supporting documents (business licence, health permit)',
                        'Your listing is reviewed by the Halalgotos team within 7 business days',
                        'Once approved, your restaurant goes live and customers can find and review it',
                      ].map(item => (
                        <li key={item} className="flex items-start gap-2 text-sm text-gray-400">
                          <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={onAddRestaurant}
                    className="w-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-bold px-6 py-3 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-amber-500/20"
                  >
                    List my restaurant →
                  </button>
                </div>
              )}

              {/* Add another restaurant — shown when owner already has at least one listing */}
              {verificationRequest && allLinkedRestaurants.length <= 1 && (
                <button
                  onClick={onAddRestaurant}
                  className="flex items-center gap-2 text-sm font-medium text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/60 px-4 py-2.5 rounded-xl transition-all duration-200 w-fit"
                >
                  <span className="text-base font-bold">+</span>
                  Add another restaurant
                </button>
              )}

              {/* Compact subscription status */}
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500">Plan</span>
                  {subscription?.status === 'canceled' ? (
                    <span className="text-xs font-semibold bg-red-500/15 border border-red-500/30 text-red-400 px-2.5 py-0.5 rounded-full">Cancelled</span>
                  ) : isPro() ? (
                    <span className="text-xs font-semibold bg-green-500/15 border border-green-500/30 text-green-400 px-2.5 py-0.5 rounded-full">Pro</span>
                  ) : isSubscribed() ? (
                    <span className="text-xs font-semibold bg-white/10 border border-white/10 text-gray-300 px-2.5 py-0.5 rounded-full">Basic</span>
                  ) : (
                    <span className="text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2.5 py-0.5 rounded-full">No plan</span>
                  )}
                  {subscription?.status === 'active' && !subscription?.cancelAtPeriodEnd && (
                    <span className="text-xs text-gray-500">· ${((subscription.amount || 0) / 100).toFixed(0)}/mo</span>
                  )}
                  {subscription?.status === 'trialing' && !subscription?.cancelAtPeriodEnd && (
                    <span className="text-xs text-gray-500">· Free trial active</span>
                  )}
                  {subscription?.cancelAtPeriodEnd && subscription?.currentPeriodEnd && (
                    <span className="text-xs text-red-400">· Cancels {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  )}
                  {subscription?.status === 'canceled' && (
                    <span className="text-xs text-gray-600">· Listing hidden</span>
                  )}
                </div>
                <a href="#settings" className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex-shrink-0">
                  {subscription?.status === 'canceled' ? 'Resubscribe →' : 'Manage billing →'}
                </a>
              </div>
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
                      { label: 'State / Province', value: verificationRequest.state },
                      { label: 'Cuisine', value: verificationRequest.cuisineType },
                      { label: 'Halal Standard', value: verificationRequest.halalStandard ? HALAL_STANDARDS.find(s => s.value === verificationRequest.halalStandard)?.label : null },
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
                          {moderatingCover ? 'Checking image…' : coverImagePreview ? 'Change cover photo' : 'Upload cover photo'}
                        </span>
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} disabled={moderatingCover} />
                    </label>
                  </div>

                  {/* Photo gallery */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">Photo Gallery</label>
                      <span className="text-xs text-gray-600">{galleryPhotos.length}/7 photos</span>
                    </div>
                    {galleryPhotos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {galleryPhotos.map((url, i) => (
                          <div key={i} className="relative group aspect-square">
                            <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover rounded-xl border border-white/10" />
                            <button
                              onClick={() => handleGalleryRemove(url)}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                            >×</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {galleryPhotos.length < 7 && (
                      <label className="flex items-center gap-2 cursor-pointer group w-fit">
                        <div className="flex items-center gap-2 bg-[#1A1A1A] border border-white/10 hover:border-amber-500/30 rounded-xl px-4 py-2.5 transition-all duration-200">
                          <svg className="w-4 h-4 text-gray-500 group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
                            {uploadingGallery ? 'Uploading…' : 'Add photo'}
                          </span>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={handleGalleryAdd} disabled={uploadingGallery} />
                      </label>
                    )}
                  </div>

                  {/* Phone number */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-500 uppercase tracking-wide">Phone Number</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      placeholder="e.g. (555) 123-4567"
                      className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 transition-all duration-200"
                    />
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

            {/* Analytics */}
            {linkedRestaurant && (
              <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Page View Analytics
                  </h2>
                </div>

                {!analyticsStats ? (
                  <p className="text-sm text-gray-500">No view data yet — analytics will appear once customers start visiting your listing.</p>
                ) : (
                  <>
                    {/* Stat cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Total views', value: analyticsStats.total },
                        { label: 'This month', value: analyticsStats.thisMonth },
                        { label: 'This week', value: analyticsStats.thisWeek },
                        { label: 'Today', value: analyticsStats.today },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-[#1A1A1A] rounded-xl px-4 py-3 space-y-1">
                          <p className="text-[11px] text-gray-500 uppercase tracking-wide">{label}</p>
                          <p className="text-2xl font-bold text-white">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Conversion + signed-in rate */}
                    <div className="flex flex-wrap gap-3">
                      <div className="flex-1 min-w-[140px] bg-[#1A1A1A] rounded-xl px-4 py-3 space-y-0.5">
                        <p className="text-[11px] text-gray-500 uppercase tracking-wide">Review conversion</p>
                        <p className="text-lg font-bold text-amber-400">{analyticsStats.conversionRate}%</p>
                        <p className="text-xs text-gray-600">of visitors leave a review</p>
                      </div>
                      <div className="flex-1 min-w-[140px] bg-[#1A1A1A] rounded-xl px-4 py-3 space-y-0.5">
                        <p className="text-[11px] text-gray-500 uppercase tracking-wide">Signed-in visitors</p>
                        <p className="text-lg font-bold text-amber-400">{analyticsStats.signedInRate}%</p>
                        <p className="text-xs text-gray-600">of viewers were logged in</p>
                      </div>
                    </div>

                    {/* 14-day bar chart */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Last 14 days</p>
                      {(() => {
                        const maxCount = Math.max(...analyticsStats.days.map(d => d.count), 1);
                        return (
                          <div className="flex items-end gap-0.5 h-16">
                            {analyticsStats.days.map((day, i) => (
                              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full flex items-end justify-center" style={{ height: '48px' }}>
                                  <div
                                    className="w-full rounded-t bg-amber-500/40 hover:bg-amber-500/70 transition-colors duration-200"
                                    style={{
                                      height: `${(day.count / maxCount) * 48}px`,
                                      minHeight: day.count > 0 ? '3px' : '0',
                                    }}
                                    title={`${day.label}: ${day.count} view${day.count !== 1 ? 's' : ''}`}
                                  />
                                </div>
                                {/* Only show label every other day to avoid crowding */}
                                {i % 2 === 0 && (
                                  <span className="text-[9px] text-gray-600 leading-none">{day.label.split(' ')[1]}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
            )}

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

            {/* Settings */}
            {(() => {
              const cancelScheduled = subscription?.cancelAtPeriodEnd;
              const periodEnd = subscription?.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : null;

              const isCancelled = subscription?.status === 'canceled';
              const cancelledAt = subscription?.cancelledAt ? new Date(subscription.cancelledAt) : null;
              const daysSinceCancelled = cancelledAt ? (Date.now() - cancelledAt.getTime()) / (1000 * 60 * 60 * 24) : null;
              const showResubscribeOffer = isCancelled;

              return (
                <div id="settings" className="bg-[#111111] border border-white/[0.06] rounded-2xl p-6 space-y-5">
                  <h2 className="text-sm font-semibold text-white">Settings</h2>

                  {/* Billing & Subscription subsection */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Billing &amp; Subscription</h3>
                      {isCancelled ? (
                        <span className="text-xs font-bold bg-red-500/15 border border-red-500/30 text-red-400 px-3 py-1 rounded-full">Cancelled</span>
                      ) : isPro() ? (
                        <span className="text-xs font-bold bg-green-500/15 border border-green-500/30 text-green-400 px-3 py-1 rounded-full">Pro</span>
                      ) : isSubscribed() ? (
                        <span className="text-xs font-bold bg-white/10 border border-white/10 text-gray-300 px-3 py-1 rounded-full">Basic</span>
                      ) : (
                        <span className="text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full">No plan</span>
                      )}
                    </div>

                    {/* Re-subscribe offer — shown immediately after cancellation */}
                    {showResubscribeOffer && (
                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 space-y-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{daysSinceCancelled !== null && daysSinceCancelled >= 2 ? '👋' : '💡'}</span>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-amber-400">
                              {daysSinceCancelled !== null && daysSinceCancelled >= 2
                                ? 'Welcome back — ready to restore your listing?'
                                : 'Changed your mind? Resubscribe anytime.'}
                            </p>
                            <p className="text-sm text-gray-400 leading-relaxed">
                              Your restaurant data is safe. Resubscribe to make your listing visible to customers again and regain full access to your dashboard.
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => handleSubscribe('basic')}
                            disabled={!!loadingSub}
                            className="text-sm font-semibold text-white bg-white/10 hover:bg-white/20 active:scale-95 px-5 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50"
                          >
                            {loadingSub === 'basic' ? 'Redirecting…' : 'Basic — $30/mo'}
                          </button>
                          <button
                            onClick={() => handleSubscribe('pro')}
                            disabled={!!loadingSub}
                            className="text-sm font-semibold text-black bg-amber-500 hover:bg-amber-400 active:scale-95 px-5 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                          >
                            {loadingSub === 'pro' ? 'Redirecting…' : 'Pro — $50/mo'}
                          </button>
                        </div>
                        <p className="text-xs text-gray-600">Your previous restaurant profile and reviews will be restored immediately.</p>
                      </div>
                    )}

                    {/* Active billing UI — hidden when cancelled */}
                    {!isCancelled && (
                    <>

                    {/* Active / trialing status line */}
                    {subscription?.status === 'trialing' && !cancelScheduled && (
                      <p className="text-sm text-gray-400">🎁 Free trial active — no charge until your trial ends.</p>
                    )}
                    {subscription?.status === 'active' && !cancelScheduled && (
                      <p className="text-sm text-gray-400">
                        Active — {subscription.plan === 'pro' ? 'Pro' : 'Basic'} plan at ${((subscription.amount || 0) / 100).toFixed(0)}/mo
                      </p>
                    )}

                    {/* Cancellation scheduled notice */}
                    {cancelScheduled && periodEnd && (
                      <div className="flex items-start gap-2.5 bg-red-500/5 border border-red-500/15 rounded-xl px-4 py-3">
                        <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-red-400">
                          Cancellation scheduled — your access continues until <span className="font-semibold">{periodEnd}</span>.
                        </p>
                      </div>
                    )}

                    {/* No subscription — show both plan options */}
                    {!isSubscribed() && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-400">Subscribe to get your restaurant listed and respond to reviews.</p>
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => handleSubscribe('basic')}
                            disabled={!!loadingSub}
                            className="text-sm font-semibold text-white bg-white/10 hover:bg-white/20 active:scale-95 px-5 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50"
                          >
                            {loadingSub === 'basic' ? 'Redirecting…' : 'Basic — $30/mo'}
                          </button>
                          <button
                            onClick={() => handleSubscribe('pro')}
                            disabled={!!loadingSub}
                            className="text-sm font-semibold text-black bg-amber-500 hover:bg-amber-400 active:scale-95 px-5 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                          >
                            {loadingSub === 'pro' ? 'Redirecting…' : 'Pro — $50/mo'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Basic subscriber — offer upgrade to Pro (not shown if cancellation is scheduled) */}
                    {isSubscribed() && !isPro() && !cancelScheduled && (
                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <span className="text-lg">⭐</span>
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-amber-400">Upgrade to Pro</p>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              Get AI-powered review summaries, advanced analytics, and priority listing. Your upgrade takes effect at the start of your next billing cycle — no extra charge today.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <button
                            onClick={handleUpgrade}
                            disabled={upgradingToPro}
                            className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {upgradingToPro ? 'Scheduling upgrade…' : 'Upgrade to Pro — $50/mo'}
                          </button>
                          <p className="text-xs text-gray-600">Charged at next renewal</p>
                        </div>
                      </div>
                    )}

                    {/* Pro subscriber — no downgrade option, just status */}
                    {isPro() && !cancelScheduled && (
                      <div className="bg-green-500/5 border border-green-500/15 rounded-xl px-4 py-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <p className="text-sm text-green-400 font-medium">You're on Pro — all features unlocked.</p>
                        </div>
                        <p className="text-xs text-gray-600 pl-6">Pro is the highest plan. Downgrading to Basic is not available.</p>
                      </div>
                    )}

                    {/* Cancel subscription — available to any active subscriber, hidden once cancellation is scheduled */}
                    {isSubscribed() && !cancelScheduled && (
                      <div className="pt-2 border-t border-white/[0.04] space-y-3">
                        {!showCancelConfirm ? (
                          <button
                            onClick={() => setShowCancelConfirm(true)}
                            className="text-xs text-gray-600 hover:text-red-400 transition-colors duration-200"
                          >
                            Cancel subscription
                          </button>
                        ) : (
                          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 space-y-3">
                            <div className="flex items-start gap-2.5">
                              <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-red-400">Are you sure you want to cancel?</p>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                  Once your billing period ends, <span className="text-white font-medium">your restaurant listing will be hidden from customers</span> and you will lose access to all dashboard features. You can resubscribe at any time to restore your listing.
                                </p>
                                <p className="text-xs text-gray-500">You'll keep full access until the end of your current billing period.</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => { handleCancel(); setShowCancelConfirm(false); }}
                                disabled={cancellingSubscription}
                                className="text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 px-4 py-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {cancellingSubscription ? 'Cancelling…' : 'Yes, cancel my subscription'}
                              </button>
                              <button
                                onClick={() => setShowCancelConfirm(false)}
                                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                              >
                                Keep my plan
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    </> /* end !isCancelled */
                    )}
                  </div>
                </div>
              );
            })()}

          </>
        )}
      </main>
    </div>
  );
}
