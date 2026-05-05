'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection, query, orderBy, getDocs, doc, getDoc, updateDoc,
} from 'firebase/firestore';

function isImageUrl(url) {
  if (!url) return false;
  const u = url.toLowerCase();
  return (
    u.includes('.jpg') ||
    u.includes('.jpeg') ||
    u.includes('.png') ||
    u.includes('.webp') ||
    // Firebase Storage image content-type param
    u.includes('image%2F')
  );
}

const STATUS_STYLES = {
  pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  approved: 'bg-green-500/10 text-green-400 border border-green-500/20',
  rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
};

function FilePreview({ url, label }) {
  if (!url) return null;
  return isImageUrl(url) ? (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <img
        src={url}
        alt={label}
        className="w-20 h-20 object-cover rounded-lg border border-white/10 hover:opacity-80 transition-opacity"
      />
    </a>
  ) : (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-2 hover:bg-white/10 transition-colors"
    >
      <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
      </svg>
      <span className="text-xs text-gray-300">{label}</span>
      <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

const REPORT_REASON_LABELS = {
  spam: 'Spam',
  fake_review: 'Fake review',
  inappropriate: 'Inappropriate',
  other: 'Other',
};

const REPORT_STATUS_STYLES = {
  pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  resolved: 'bg-green-500/10 text-green-400 border border-green-500/20',
  dismissed: 'bg-white/5 text-gray-500 border border-white/10',
};

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('verifications');
  const [requests, setRequests] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportActionLoading, setReportActionLoading] = useState({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          if (snap.exists() && snap.data().role === 'admin') {
            setIsAdmin(true);
          }
        } catch (_) {}
      }
      setLoadingAuth(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (isAdmin) { fetchRequests(); fetchReports(); }
  }, [isAdmin]);

  async function fetchRequests() {
    setLoadingReqs(true);
    try {
      const q = query(collection(db, 'verification_requests'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (_) {}
    setLoadingReqs(false);
  }

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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reqId, status }),
      });
      const data = await res.json();
      if (data.ok) {
        setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status } : r));
      }
    } catch (_) {}
    setActionLoading(prev => ({ ...prev, [reqId]: false }));
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

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Admin</h1>
          <button
            onClick={() => activeTab === 'verifications' ? fetchRequests() : fetchReports()}
            disabled={loadingReqs || loadingReports}
            className="text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            {(loadingReqs || loadingReports) ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
          {[
            { id: 'verifications', label: `Verifications (${requests.length})` },
            { id: 'reports', label: `Reports (${reports.filter(r => r.status === 'pending').length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-[#1a1a1a] text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Verifications tab */}
        {activeTab === 'verifications' && (
          <>
            {loadingReqs && requests.length === 0 && (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-green-500/40 border-t-green-500 rounded-full animate-spin" />
              </div>
            )}
            {!loadingReqs && requests.length === 0 && (
              <div className="bg-[#111111] border border-white/5 rounded-2xl p-12 text-center">
                <p className="text-gray-400 font-medium">No verification requests yet</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'verifications' && requests.map(req => (
          <div key={req.id} className="bg-[#111111] border border-white/5 rounded-2xl p-6 space-y-5">
            {/* Owner info + status */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-white text-sm">{req.userName || 'Unknown'}</p>
                <p className="text-gray-500 text-xs mt-0.5">{req.userEmail}</p>
                <p className="text-gray-600 text-xs mt-1">
                  {req.createdAt?.toDate?.()?.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) ?? 'Date unknown'}
                </p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_STYLES[req.status] ?? STATUS_STYLES.pending}`}>
                {req.status ?? 'pending'}
              </span>
            </div>

            {/* Proof documents */}
            {req.proofs?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Proof Documents</p>
                <div className="flex flex-wrap gap-2">
                  {req.proofs.map((url, i) => (
                    <FilePreview key={i} url={url} label={`Proof ${i + 1}`} />
                  ))}
                </div>
              </div>
            )}

            {/* Business License */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Business License</p>
              {req.businessLicenseUrl ? (
                <FilePreview url={req.businessLicenseUrl} label="Business License" />
              ) : (
                <p className="text-xs text-gray-600 italic">Not provided</p>
              )}
            </div>

            {/* Health Permit */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Health Permit / Food Safety Certificate</p>
              {req.healthPermitUrl ? (
                <FilePreview url={req.healthPermitUrl} label="Health Permit" />
              ) : (
                <p className="text-xs text-gray-600 italic">Not provided</p>
              )}
            </div>

            {/* Halal Certificate */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Halal Certification Certificate</p>
              {req.halalCertificateUrl ? (
                <FilePreview url={req.halalCertificateUrl} label="Halal Certificate" />
              ) : (
                <p className="text-xs text-gray-600 italic">Not provided</p>
              )}
              {(req.certifyingBody || req.certificationNumber || req.certExpiryDate) && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {req.certifyingBody && (
                    <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-full">
                      {req.certifyingBody}
                    </span>
                  )}
                  {req.certificationNumber && (
                    <span className="text-xs bg-white/5 text-gray-400 border border-white/10 px-2.5 py-1 rounded-full">
                      #{req.certificationNumber}
                    </span>
                  )}
                  {req.certExpiryDate && (
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${
                      new Date(req.certExpiryDate) < new Date()
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : (new Date(req.certExpiryDate) - new Date()) / 86400000 <= 30
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          : 'bg-green-500/10 text-green-400 border-green-500/20'
                    }`}>
                      Expires {new Date(req.certExpiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Links */}
            {(req.websiteUrl || req.mapsUrl) && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Links</p>
                <div className="flex flex-wrap gap-2">
                  {req.websiteUrl && (
                    <a
                      href={req.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 bg-green-500/5 border border-green-500/15 rounded-lg px-3 py-1.5 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                      </svg>
                      Website
                    </a>
                  )}
                  {req.mapsUrl && (
                    <a
                      href={req.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 bg-green-500/5 border border-green-500/15 rounded-lg px-3 py-1.5 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      Google Maps
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Approve / Reject */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => updateStatus(req.id, 'approved')}
                disabled={req.status === 'approved' || actionLoading[req.id]}
                className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {actionLoading[req.id] ? '…' : 'Approve'}
              </button>
              <button
                onClick={() => updateStatus(req.id, 'rejected')}
                disabled={req.status === 'rejected' || actionLoading[req.id]}
                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {actionLoading[req.id] ? '…' : 'Reject'}
              </button>
            </div>
          </div>
        ))}

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
  );
}
