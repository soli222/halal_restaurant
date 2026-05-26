'use client';
import { useState, useEffect } from 'react';
import { HALAL_STANDARDS, ALCOHOL_POLICIES } from '../constants';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection, query, orderBy, getDocs, doc, getDoc, updateDoc, onSnapshot,
} from 'firebase/firestore';

function isImageUrl(url) {
  if (!url) return false;
  const u = url.toLowerCase();
  return (
    u.includes('.jpg') || u.includes('.jpeg') || u.includes('.png') ||
    u.includes('.webp') || u.includes('image%2F')
  );
}

const STATUS_STYLES = {
  pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  approved: 'bg-green-500/10 text-green-400 border border-green-500/20',
  rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
};

const REPORT_REASON_LABELS = {
  spam: 'Spam', fake_review: 'Fake review', inappropriate: 'Inappropriate', other: 'Other',
};

const REPORT_STATUS_STYLES = {
  pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  resolved: 'bg-green-500/10 text-green-400 border border-green-500/20',
  dismissed: 'bg-white/5 text-gray-500 border border-white/10',
};

const CHECKLIST_ITEMS = [
  { key: 'bizName',    label: 'Business name on documents matches submitted name' },
  { key: 'certNumber', label: 'Cert number on certificate matches entered number' },
  { key: 'certExpiry', label: 'Expiry date on certificate matches entered date' },
  { key: 'certBody',   label: 'Certifying body is correct and legitimate' },
  { key: 'bizCity',    label: 'Business location / city is consistent' },
  { key: 'allSameBiz', label: 'All documents belong to the same business' },
];

// ── Clickable document thumbnail ──────────────────────────────────────────────
function DocThumb({ url, label, onOpen }) {
  if (!url) return null;
  return isImageUrl(url) ? (
    <button
      onClick={() => onOpen(url, label)}
      className="relative group w-20 h-20 rounded-lg border border-white/10 overflow-hidden hover:border-white/30 transition-all"
    >
      <img src={url} alt={label} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
        <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
      </div>
    </button>
  ) : (
    <div className="flex gap-2">
      <button
        onClick={() => onOpen(url, label)}
        className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-2 hover:bg-white/10 transition-colors"
      >
        <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
        </svg>
        <span className="text-xs text-gray-300">{label}</span>
      </button>
      <a
        href={url} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-2 hover:bg-white/10 transition-colors"
        title="Open in new tab"
      >
        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
}

// ── Document lightbox with comparison panel ───────────────────────────────────
function Lightbox({ lightbox, onClose }) {
  if (!lightbox) return null;
  const { url, label, req } = lightbox;
  const isPdf = !isImageUrl(url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-5xl max-h-[90vh] bg-[#111111] border border-white/10 rounded-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Lightbox header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] flex-shrink-0">
          <span className="text-sm font-semibold text-white">{label}</span>
          <div className="flex items-center gap-2">
            <a
              href={url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in new tab
            </a>
            <button onClick={onClose} className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Lightbox body — document left, info right */}
        <div className="flex flex-col md:flex-row overflow-hidden flex-1 min-h-0">
          {/* Document viewer */}
          <div className="flex-1 bg-[#0A0A0A] flex items-center justify-center overflow-auto min-h-0">
            {isPdf ? (
              <iframe src={url} className="w-full h-full min-h-[400px]" title={label} />
            ) : (
              <img src={url} alt={label} className="max-w-full max-h-full object-contain p-4" />
            )}
          </div>

          {/* Comparison panel */}
          <div className="w-full md:w-72 flex-shrink-0 border-t md:border-t-0 md:border-l border-white/[0.06] overflow-y-auto">
            <div className="p-4 space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Submitted details</p>
              <p className="text-[11px] text-gray-500">Cross-check these values against the document on the left.</p>

              <div className="space-y-3">
                <InfoRow label="Business name" value={req.businessName} highlight />
                <InfoRow label="City" value={req.ownerCity} />
                <InfoRow label="State / Province" value={req.state} />
                <InfoRow label="Cuisine" value={req.cuisineType || '—'} />
                {req.halalStandard && (
                  <InfoRow label="Halal Standard" value={HALAL_STANDARDS.find(s => s.value === req.halalStandard)?.label} />
                )}
                {req.alcoholPolicy && (
                  <InfoRow label="Alcohol Policy" value={ALCOHOL_POLICIES.find(p => p.value === req.alcoholPolicy)?.label} />
                )}
                {req.cuisineOther && (
                  <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 px-3 py-2">
                    <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-1">Custom cuisine type</p>
                    <p className="text-xs text-gray-300">{req.cuisineOther}</p>
                  </div>
                )}
                <InfoRow label="Certifying body" value={req.certifyingBody} highlight />
                {req.certifyingBody === 'Other' && req.certOtherDetails && (
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                    <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1">Owner's cert description</p>
                    <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{req.certOtherDetails}</p>
                  </div>
                )}
                <InfoRow label="Cert number" value={req.certNumberNA ? 'N/A' : req.certificationNumber ? `#${req.certificationNumber}` : null} highlight />
                {req.certNumberNA && req.certNumberNADetails && (
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2">
                    <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-1">Why no cert number</p>
                    <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{req.certNumberNADetails}</p>
                  </div>
                )}
                <InfoRow label="Cert expiry" value={req.certExpiryDate ? new Date(req.certExpiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null} />
                <InfoRow label="Owner name" value={req.userName} />
                <InfoRow label="Owner email" value={req.userEmail} />
              </div>

              {req.websiteUrl && (
                <a href={req.websiteUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors mt-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3" />
                  </svg>
                  Visit website
                </a>
              )}
              {req.mapsUrl && (
                <a href={req.mapsUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  View on Google Maps
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight }) {
  return (
    <div>
      <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm break-all ${highlight ? 'text-white font-medium' : 'text-gray-400'}`}>
        {value || <span className="text-gray-600 italic">Not provided</span>}
      </p>
    </div>
  );
}

// ── Main admin page ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('verifications');
  const [verificationFilter, setVerificationFilter] = useState('pending');
  const [requests, setRequests] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [syncLoading, setSyncLoading] = useState({});
  const [syncResult, setSyncResult] = useState({});
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportActionLoading, setReportActionLoading] = useState({});
  // Option 1 — lightbox
  const [lightbox, setLightbox] = useState(null);
  // Option 2 — per-request checklists (local session state)
  const [checklists, setChecklists] = useState({});
  // collapsed checklist sections
  const [checklistOpen, setChecklistOpen] = useState({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          if (snap.exists() && snap.data().role === 'admin') setIsAdmin(true);
        } catch (_) {}
      }
      setLoadingAuth(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingReqs(true);
    const q = query(collection(db, 'verification_requests'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingReqs(false);
    }, () => setLoadingReqs(false));
    fetchReports();
    return () => unsub();
  }, [isAdmin]);

  async function fetchReports() {
    setLoadingReports(true);
    try {
      const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (_) {}
    setLoadingReports(false);
  }

  async function updateReportStatus(reportId, status) {
    setReportActionLoading(prev => ({ ...prev, [reportId]: true }));
    try {
      await updateDoc(doc(db, 'reports', reportId), { status });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
    } catch (_) {}
    setReportActionLoading(prev => ({ ...prev, [reportId]: false }));
  }

  async function updateStatus(reqId, status) {
    setActionLoading(prev => ({ ...prev, [reqId]: true }));
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reqId, status }),
      });
      const data = await res.json();
      if (data.ok) setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status } : r));
    } catch (_) {}
    setActionLoading(prev => ({ ...prev, [reqId]: false }));
  }

  async function syncGooglePlaces(reqId) {
    setSyncLoading(prev => ({ ...prev, [reqId]: true }));
    setSyncResult(prev => ({ ...prev, [reqId]: null }));
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/sync-google-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reqId }),
      });
      const data = await res.json();
      setSyncResult(prev => ({
        ...prev,
        [reqId]: data.ok ? { ok: true, msg: data.message || 'Synced!' } : { ok: false, msg: data.error || 'Not found on Google.' },
      }));
    } catch {
      setSyncResult(prev => ({ ...prev, [reqId]: { ok: false, msg: 'Sync failed.' } }));
    }
    setSyncLoading(prev => ({ ...prev, [reqId]: false }));
  }

  function toggleCheck(reqId, key) {
    setChecklists(prev => ({
      ...prev,
      [reqId]: { ...(prev[reqId] || {}), [key]: !(prev[reqId]?.[key]) },
    }));
  }

  function checkedCount(reqId) {
    return CHECKLIST_ITEMS.filter(i => checklists[reqId]?.[i.key]).length;
  }

  function registrySearchUrl(req) {
    const parts = [req.certifyingBody, req.certificationNumber, 'halal certificate verify'].filter(Boolean);
    return `https://www.google.com/search?q=${encodeURIComponent(parts.join(' '))}`;
  }

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-green-500/40 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-white font-semibold">Access Denied</p>
          <p className="text-gray-500 text-sm">This page is restricted to admins.</p>
        </div>
      </div>
    );
  }

  const pendingVerifications = requests.filter(r => !r.status || r.status === 'pending');
  const approvedVerifications = requests.filter(r => r.status === 'approved');
  const rejectedVerifications = requests.filter(r => r.status === 'rejected');
  const filteredRequests =
    verificationFilter === 'approved' ? approvedVerifications :
    verificationFilter === 'rejected' ? rejectedVerifications :
    pendingVerifications;
  const pendingReports = reports.filter(r => r.status === 'pending');

  function isNew(req) {
    if (!req.createdAt?.toDate) return false;
    return (Date.now() - req.createdAt.toDate().getTime()) < 24 * 60 * 60 * 1000;
  }

  return (
    <>
      {/* Option 1 — Document lightbox */}
      <Lightbox lightbox={lightbox} onClose={() => setLightbox(null)} />

      <div className="min-h-screen bg-[#0A0A0A] text-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Admin</h1>
            <button
              onClick={() => fetchReports()}
              disabled={loadingReports}
              className="text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              {loadingReports ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {/* Pending verifications alert banner */}
          {pendingVerifications.length > 0 && (
            <button
              onClick={() => setActiveTab('verifications')}
              className="w-full flex items-center gap-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl px-5 py-4 hover:bg-amber-500/15 transition-colors text-left"
            >
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[10px] font-bold text-black">
                  {pendingVerifications.length}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-400">
                  {pendingVerifications.length === 1 ? '1 restaurant pending verification' : `${pendingVerifications.length} restaurants pending verification`}
                </p>
                <p className="text-xs text-amber-400/60 mt-0.5 truncate">
                  {pendingVerifications.map(r => r.businessName || r.userName || 'Unknown').join(' · ')}
                </p>
              </div>
              <svg className="w-4 h-4 text-amber-400/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Tabs */}
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
            {[
              { id: 'verifications', label: 'Verifications', count: pendingVerifications.length },
              { id: 'reports', label: 'Reports', count: pendingReports.length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === tab.id ? 'bg-[#1a1a1a] text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="bg-amber-500 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Verification sub-tabs */}
          {activeTab === 'verifications' && (
            <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] p-1 rounded-xl">
              {[
                { id: 'pending', label: 'Pending', count: pendingVerifications.length, color: 'amber' },
                { id: 'approved', label: 'Approved', count: approvedVerifications.length, color: 'green' },
                { id: 'rejected', label: 'Rejected', count: rejectedVerifications.length, color: 'red' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setVerificationFilter(tab.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    verificationFilter === tab.id ? 'bg-[#1a1a1a] text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none ${
                      tab.color === 'amber' ? 'bg-amber-500 text-black' :
                      tab.color === 'green' ? 'bg-green-500/20 text-green-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Verifications tab — empty states */}
          {activeTab === 'verifications' && loadingReqs && requests.length === 0 && (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-green-500/40 border-t-green-500 rounded-full animate-spin" />
            </div>
          )}
          {activeTab === 'verifications' && !loadingReqs && filteredRequests.length === 0 && (
            <div className="bg-[#111111] border border-white/5 rounded-2xl p-12 text-center">
              <p className="text-gray-400 font-medium">
                {verificationFilter === 'pending' ? 'No pending requests' :
                 verificationFilter === 'approved' ? 'No approved listings yet' :
                 'No rejected requests'}
              </p>
            </div>
          )}

          {/* Verification request cards */}
          {activeTab === 'verifications' && filteredRequests.map(req => {
            const isPending = !req.status || req.status === 'pending';
            const checked = checkedCount(req.id);
            const allChecked = checked === CHECKLIST_ITEMS.length;
            const isChecklistOpen = checklistOpen[req.id] ?? isPending;

            return (
              <div key={req.id} className={`bg-[#111111] rounded-2xl p-6 space-y-5 border ${
                isPending ? 'border-amber-500/20' : 'border-white/5'
              }`}>
                {/* Owner info + status */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white text-sm">{req.userName || 'Unknown'}</p>
                      {isNew(req) && isPending && (
                        <span className="text-[10px] font-bold bg-amber-500 text-black px-2 py-0.5 rounded-full">NEW</span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">{req.userEmail}</p>
                    <p className="text-gray-600 text-xs mt-1">
                      {req.createdAt?.toDate?.()?.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) ?? 'Date unknown'}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_STYLES[req.status] ?? STATUS_STYLES.pending}`}>
                    {req.status ?? 'pending'}
                  </span>
                </div>

                {/* Restaurant info summary */}
                <div className="bg-[#0D0D0D] border border-white/[0.06] rounded-xl px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">Business name</p>
                    <p className="text-sm text-white font-medium mt-0.5">{req.businessName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">City</p>
                    <p className="text-sm text-gray-300 mt-0.5">{req.ownerCity || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">State / Province</p>
                    <p className="text-sm text-gray-300 mt-0.5">{req.state || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">Cuisine</p>
                    <p className="text-sm text-gray-300 mt-0.5">{req.cuisineType || '—'}</p>
                  </div>
                  {req.halalStandard && (
                    <div>
                      <p className="text-[10px] text-gray-600 uppercase tracking-wider">Halal Standard</p>
                      <p className="text-sm text-gray-300 mt-0.5">{HALAL_STANDARDS.find(s => s.value === req.halalStandard)?.label || '—'}</p>
                    </div>
                  )}
                  {req.alcoholPolicy && (
                    <div>
                      <p className="text-[10px] text-gray-600 uppercase tracking-wider">Alcohol Policy</p>
                      <p className="text-sm text-gray-300 mt-0.5">{ALCOHOL_POLICIES.find(p => p.value === req.alcoholPolicy)?.label || '—'}</p>
                    </div>
                  )}
                  {req.cuisineOther && (
                    <div className="col-span-2 rounded-lg bg-purple-500/10 border border-purple-500/20 px-3 py-2">
                      <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-1">Custom cuisine type</p>
                      <p className="text-xs text-gray-300">{req.cuisineOther}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">Certifying body</p>
                    <p className="text-sm text-white font-medium mt-0.5">{req.certifyingBody || '—'}</p>
                  </div>
                  {req.certifyingBody === 'Other' && req.certOtherDetails && (
                    <div className="col-span-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                      <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1">Owner's cert description</p>
                      <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{req.certOtherDetails}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">Cert number</p>
                    <p className="text-sm text-white font-medium mt-0.5">{req.certNumberNA ? 'N/A' : req.certificationNumber ? `#${req.certificationNumber}` : '—'}</p>
                  </div>
                  {req.certNumberNA && req.certNumberNADetails && (
                    <div className="col-span-2 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2">
                      <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-1">Why no cert number</p>
                      <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{req.certNumberNADetails}</p>
                    </div>
                  )}
                  {req.certExpiryDate && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-gray-600 uppercase tracking-wider">Cert expiry</p>
                      <p className={`text-sm font-medium mt-0.5 ${
                        new Date(req.certExpiryDate) < new Date() ? 'text-red-400' :
                        (new Date(req.certExpiryDate) - new Date()) / 86400000 <= 30 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {new Date(req.certExpiryDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        {new Date(req.certExpiryDate) < new Date() && ' — EXPIRED'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Documents — clickable thumbnails (Option 1) */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Documents — click to inspect</p>

                  <div className="space-y-2">
                    {req.halalCertificateUrl && (
                      <div className="flex items-center gap-3">
                        <DocThumb url={req.halalCertificateUrl} label="Halal Certificate" onOpen={(url, label) => setLightbox({ url, label, req })} />
                        <span className="text-xs text-gray-500">Halal Certificate</span>
                      </div>
                    )}
                    {req.businessLicenseUrl && (
                      <div className="flex items-center gap-3">
                        <DocThumb url={req.businessLicenseUrl} label="Business License" onOpen={(url, label) => setLightbox({ url, label, req })} />
                        <span className="text-xs text-gray-500">Business License</span>
                      </div>
                    )}
                    {req.healthPermitUrl && (
                      <div className="flex items-center gap-3">
                        <DocThumb url={req.healthPermitUrl} label="Health Permit" onOpen={(url, label) => setLightbox({ url, label, req })} />
                        <span className="text-xs text-gray-500">Health Permit</span>
                      </div>
                    )}
                    {req.proofs?.length > 0 && (
                      <div className="flex items-start gap-3">
                        <div className="flex flex-wrap gap-2">
                          {req.proofs.map((url, i) => (
                            <DocThumb key={i} url={url} label={`Supporting Doc ${i + 1}`} onOpen={(url, label) => setLightbox({ url, label, req })} />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 mt-1">Supporting documents</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Option 4 — Registry lookup */}
                <div className="flex flex-wrap gap-2">
                  <a
                    href={registrySearchUrl(req)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 rounded-lg px-3 py-2 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Look up cert in registry
                  </a>
                  {req.websiteUrl && (
                    <a href={req.websiteUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 bg-green-500/5 border border-green-500/15 rounded-lg px-3 py-2 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                      </svg>
                      Website
                    </a>
                  )}
                  {req.mapsUrl && (
                    <a href={req.mapsUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 bg-green-500/5 border border-green-500/15 rounded-lg px-3 py-2 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      Google Maps
                    </a>
                  )}
                </div>

                {/* Option 2 — Verification checklist */}
                <div className="border border-white/[0.06] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setChecklistOpen(prev => ({ ...prev, [req.id]: !isChecklistOpen }))}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <span className="text-xs font-medium text-gray-400">Verification checklist</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${allChecked ? 'text-green-400' : 'text-gray-500'}`}>
                        {checked}/{CHECKLIST_ITEMS.length}
                      </span>
                      {allChecked && (
                        <span className="text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/25 px-2 py-0.5 rounded-full">All verified</span>
                      )}
                      <svg className={`w-4 h-4 text-gray-600 transition-transform ${isChecklistOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isChecklistOpen && (
                    <div className="px-4 pb-4 pt-1 space-y-2.5 border-t border-white/[0.06]">
                      {CHECKLIST_ITEMS.map(item => (
                        <label key={item.key} className="flex items-start gap-3 cursor-pointer group">
                          <div className={`w-4 h-4 mt-0.5 rounded flex-shrink-0 border transition-all ${
                            checklists[req.id]?.[item.key]
                              ? 'bg-green-500 border-green-500'
                              : 'border-white/20 group-hover:border-white/40'
                          } flex items-center justify-center`}
                            onClick={() => toggleCheck(req.id, item.key)}
                          >
                            {checklists[req.id]?.[item.key] && (
                              <svg className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span
                            className={`text-sm leading-snug transition-colors ${
                              checklists[req.id]?.[item.key] ? 'text-gray-500 line-through' : 'text-gray-300 group-hover:text-white'
                            }`}
                            onClick={() => toggleCheck(req.id, item.key)}
                          >
                            {item.label}
                          </span>
                        </label>
                      ))}
                      {!allChecked && (
                        <p className="text-xs text-gray-600 pt-1">Tick all items before approving to confirm you've reviewed the documents.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Approve / Reject */}
                <div className="flex items-center gap-2 pt-1">
                  {verificationFilter === 'pending' && (
                    <>
                      <button
                        onClick={() => updateStatus(req.id, 'approved')}
                        disabled={actionLoading[req.id]}
                        className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {actionLoading[req.id] ? '…' : 'Approve'}
                      </button>
                      <button
                        onClick={() => updateStatus(req.id, 'rejected')}
                        disabled={actionLoading[req.id]}
                        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {actionLoading[req.id] ? '…' : 'Reject'}
                      </button>
                      {!allChecked && (
                        <p className="text-xs text-gray-600 ml-1">{CHECKLIST_ITEMS.length - checked} check{CHECKLIST_ITEMS.length - checked !== 1 ? 's' : ''} remaining</p>
                      )}
                    </>
                  )}
                  {verificationFilter === 'approved' && (
                    <>
                      <button
                        onClick={() => updateStatus(req.id, 'rejected')}
                        disabled={actionLoading[req.id]}
                        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {actionLoading[req.id] ? '…' : 'Reject listing'}
                      </button>
                      <button
                        onClick={() => syncGooglePlaces(req.id)}
                        disabled={syncLoading[req.id]}
                        className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {syncLoading[req.id] ? '…' : 'Sync Google'}
                      </button>
                      {syncResult[req.id] && (
                        <span className={`text-xs ${syncResult[req.id].ok ? 'text-green-400' : 'text-red-400'}`}>
                          {syncResult[req.id].msg}
                        </span>
                      )}
                    </>
                  )}
                  {verificationFilter === 'rejected' && (
                    <button
                      onClick={() => updateStatus(req.id, 'approved')}
                      disabled={actionLoading[req.id]}
                      className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {actionLoading[req.id] ? '…' : 'Approve listing'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Reports tab */}
          {activeTab === 'reports' && (
            <>
              {loadingReports && reports.length === 0 && (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-green-500/40 border-t-green-500 rounded-full animate-spin" />
                </div>
              )}
              {!loadingReports && reports.length === 0 && (
                <div className="bg-[#111111] border border-white/5 rounded-2xl p-12 text-center">
                  <p className="text-gray-400 font-medium">No reports yet</p>
                </div>
              )}
              {reports.map(report => (
                <div key={report.id} className="bg-[#111111] border border-white/5 rounded-2xl p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-white text-sm">{report.restaurantName}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">
                          {REPORT_REASON_LABELS[report.reason] ?? report.reason}
                        </span>
                        <span className="text-xs text-gray-600">
                          {report.createdAt?.toDate?.()?.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) ?? 'Date unknown'}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${REPORT_STATUS_STYLES[report.status] ?? REPORT_STATUS_STYLES.pending}`}>
                      {report.status ?? 'pending'}
                    </span>
                  </div>
                  {report.reviewText && (
                    <div className="bg-[#0D0D0D] border border-white/[0.06] rounded-xl px-4 py-3">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Review excerpt</p>
                      <p className="text-sm text-gray-300 leading-relaxed">{report.reviewText}</p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => updateReportStatus(report.id, 'resolved')}
                      disabled={report.status === 'resolved' || reportActionLoading[report.id]}
                      className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {reportActionLoading[report.id] ? '…' : 'Resolve'}
                    </button>
                    <button
                      onClick={() => updateReportStatus(report.id, 'dismissed')}
                      disabled={report.status === 'dismissed' || reportActionLoading[report.id]}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {reportActionLoading[report.id] ? '…' : 'Dismiss'}
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}
