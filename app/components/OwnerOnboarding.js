import { CUISINES, CERTIFYING_BODIES } from '../constants';

export default function OwnerOnboarding({
  ownerStep, setOwnerStep,
  user, handleSignInToSubmit,
  verifyError, setVerifyError,
  ownerBusinessName, setOwnerBusinessName,
  ownerCity, setOwnerCity,
  ownerCuisineType, setOwnerCuisineType,
  certifyingBody, setCertifyingBody,
  certNumber, setCertNumber,
  certExpiry, setCertExpiry,
  halalCertFile, setHalalCertFile,
  businessLicenseFile, setBusinessLicenseFile,
  healthPermitFile, setHealthPermitFile,
  verifyFiles,
  websiteUrl, setWebsiteUrl,
  mapsUrl, setMapsUrl,
  confirmOwnership, setConfirmOwnership,
  verifyLoading,
  submitVerification,
  handleSingleFile,
  handleVerifyFiles,
}) {
  const stepValidate = () => {
    setVerifyError('');
    if (ownerStep === 1) {
      if (!ownerBusinessName.trim()) { setVerifyError('Please enter your restaurant name.'); return; }
      if (!ownerCity.trim()) { setVerifyError('Please enter your city.'); return; }
      if (!ownerCuisineType) { setVerifyError('Please select a cuisine type.'); return; }
    }
    if (ownerStep === 2) {
      if (!certifyingBody) { setVerifyError('Please select a certifying body.'); return; }
      if (!certNumber.trim()) { setVerifyError('Please enter your certification number.'); return; }
      if (!certExpiry) { setVerifyError('Please enter the certificate expiry date.'); return; }
    }
    if (ownerStep === 3) {
      if (!halalCertFile) { setVerifyError('Please upload your Halal Certificate.'); return; }
      if (!businessLicenseFile) { setVerifyError('Please upload your Business License.'); return; }
      if (!healthPermitFile) { setVerifyError('Please upload your Health Permit.'); return; }
    }
    setVerifyError('');
    setOwnerStep(s => s + 1);
  };

  const STEPS = [
    { num: 1, icon: '🏪', title: 'Your Restaurant',         hint: "Let's set up your profile. We'll use this to create your restaurant's listing so customers can find you on HalalSpot." },
    { num: 2, icon: '✅', title: 'Halal Certification',     hint: 'Halal certification is the foundation of trust on HalalSpot. Customers rely on this information to make dining decisions with confidence.' },
    { num: 3, icon: '📄', title: 'Certification Documents', hint: 'Our verification team reviews these documents to confirm your certification is authentic before your listing goes live. All files are stored securely.' },
    { num: 4, icon: '🌐', title: 'Online Presence',          hint: "Help customers find and learn about your restaurant before they visit. These are optional but improve your listing's visibility." },
    { num: 5, icon: '📋', title: 'Review & Confirm',         hint: 'Take a moment to review your details before submitting. Our team will verify your submission within 1–2 business days.' },
  ];
  const currentStep = STEPS[ownerStep - 1];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-100">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-20 h-1 bg-white/5">
        <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${(ownerStep / 5) * 100}%` }} />
      </div>

      {/* Header */}
      <header className="pt-7 pb-4 px-5 flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-2 text-white font-bold text-lg">
          <span>☪️</span><span>HalalSpot</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">Step {ownerStep} of 5</span>
          <button
            onClick={() => setOwnerStep(null)}
            className="text-xs text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all duration-200"
          >
            ← Home
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pb-20 pt-4 space-y-6">
        {/* Step header */}
        <div className="space-y-1">
          <div className="text-3xl">{currentStep.icon}</div>
          <h2 className="text-2xl font-bold text-white">{currentStep.title}</h2>
        </div>

        {/* Why this step matters */}
        <div className="bg-green-500/[0.07] border border-green-500/20 rounded-2xl px-4 py-3.5">
          <p className="text-sm text-green-300/80 leading-relaxed">{currentStep.hint}</p>
        </div>

        {/* ── Step 1 ── */}
        {ownerStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Restaurant Name <span className="text-red-400">*</span></label>
              <input
                value={ownerBusinessName}
                onChange={e => setOwnerBusinessName(e.target.value)}
                placeholder="e.g. Al-Noor Kitchen"
                className="w-full bg-[#111111] rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 border border-white/10 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all duration-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">City <span className="text-red-400">*</span></label>
              <input
                value={ownerCity}
                onChange={e => setOwnerCity(e.target.value)}
                placeholder="e.g. Toronto"
                className="w-full bg-[#111111] rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 border border-white/10 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all duration-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Cuisine Type <span className="text-red-400">*</span></label>
              <select
                value={ownerCuisineType}
                onChange={e => setOwnerCuisineType(e.target.value)}
                className="w-full bg-[#111111] rounded-xl px-4 py-3 text-sm text-gray-100 border border-white/10 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all duration-200 appearance-none"
              >
                <option value="">Select a cuisine type…</option>
                {CUISINES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ── Step 2 ── */}
        {ownerStep === 2 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Certifying Body <span className="text-red-400">*</span></label>
              <select
                value={certifyingBody}
                onChange={e => setCertifyingBody(e.target.value)}
                className="w-full bg-[#111111] rounded-xl px-4 py-3 text-sm text-gray-100 border border-white/10 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all duration-200 appearance-none"
              >
                <option value="">Select a certifying body…</option>
                {CERTIFYING_BODIES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Certification Number <span className="text-red-400">*</span></label>
              <input
                value={certNumber}
                onChange={e => setCertNumber(e.target.value)}
                placeholder="e.g. ISNA-2024-00123"
                className="w-full bg-[#111111] rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 border border-white/10 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all duration-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Certificate Expiry Date <span className="text-red-400">*</span></label>
              <input
                type="date"
                value={certExpiry}
                onChange={e => setCertExpiry(e.target.value)}
                className="w-full bg-[#111111] rounded-xl px-4 py-3 text-sm text-gray-100 border border-white/10 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all duration-200"
              />
            </div>
          </div>
        )}

        {/* ── Step 3 ── */}
        {ownerStep === 3 && (
          <div className="space-y-5">
            {[
              { label: 'Halal Certificate', file: halalCertFile, setter: setHalalCertFile, required: true },
              { label: 'Business License', file: businessLicenseFile, setter: setBusinessLicenseFile, required: true },
              { label: 'Health Permit / Food Safety Certificate', file: healthPermitFile, setter: setHealthPermitFile, required: true },
            ].map(({ label, file, setter, required }) => (
              <div key={label} className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {label} {required && <span className="text-red-400">*</span>}
                </label>
                <label className="flex items-center gap-3 bg-[#111111] border border-white/10 hover:border-green-500/40 rounded-xl px-4 py-3 cursor-pointer transition-all duration-200 group">
                  <svg className="w-4 h-4 text-gray-500 group-hover:text-green-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors">{file ? file.name : 'Click to upload (JPG, PNG, or PDF, max 5MB)'}</span>
                  <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={e => handleSingleFile(e, setter)} />
                </label>
                {file && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg w-fit">
                    <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs text-green-400 font-medium truncate max-w-[220px]">{file.name}</span>
                  </div>
                )}
              </div>
            ))}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Additional Supporting Documents <span className="text-gray-600 normal-case font-normal">(optional — up to 5 files)</span>
              </label>
              <label className="flex items-center gap-3 bg-[#111111] border border-white/10 hover:border-green-500/40 rounded-xl px-4 py-3 cursor-pointer transition-all duration-200 group">
                <svg className="w-4 h-4 text-gray-500 group-hover:text-green-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors">
                  {verifyFiles.length > 0 ? `${verifyFiles.length} file(s) selected` : 'Click to upload additional files'}
                </span>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" multiple className="hidden" onChange={handleVerifyFiles} />
              </label>
            </div>
          </div>
        )}

        {/* ── Step 4 ── */}
        {ownerStep === 4 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Website URL <span className="text-gray-600 normal-case font-normal">(optional)</span></label>
              <input
                value={websiteUrl}
                onChange={e => setWebsiteUrl(e.target.value)}
                placeholder="https://myrestaurant.com"
                className="w-full bg-[#111111] rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 border border-white/10 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all duration-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Google Maps Link <span className="text-gray-600 normal-case font-normal">(optional)</span></label>
              <input
                value={mapsUrl}
                onChange={e => setMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/..."
                className="w-full bg-[#111111] rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 border border-white/10 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all duration-200"
              />
            </div>
            <p className="text-xs text-gray-600">You can add or update these later from your owner dashboard.</p>
          </div>
        )}

        {/* ── Step 5 ── */}
        {ownerStep === 5 && (
          <div className="space-y-4">
            <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-5 space-y-3">
              {[
                { label: 'Restaurant', value: ownerBusinessName },
                { label: 'City', value: ownerCity },
                { label: 'Cuisine', value: ownerCuisineType },
                { label: 'Certifying Body', value: certifyingBody },
                { label: 'Cert Number', value: certNumber },
                { label: 'Cert Expiry', value: certExpiry },
                { label: 'Halal Certificate', value: halalCertFile?.name },
                { label: 'Business License', value: businessLicenseFile?.name },
                { label: 'Health Permit', value: healthPermitFile?.name },
                { label: 'Website', value: websiteUrl || '—' },
                { label: 'Google Maps', value: mapsUrl || '—' },
              ].map(({ label, value }) => value && (
                <div key={label} className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500 flex-shrink-0">{label}</span>
                  <span className="text-gray-200 text-right truncate">{value}</span>
                </div>
              ))}
            </div>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={confirmOwnership}
                onChange={e => setConfirmOwnership(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-green-500 flex-shrink-0"
              />
              <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
                I confirm this is my business and I understand false claims will result in a permanent ban <span className="text-red-400">*</span>
              </span>
            </label>
          </div>
        )}

        {/* Error */}
        {verifyError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{verifyError}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          {ownerStep > 1 && (
            <button
              onClick={() => { setOwnerStep(s => s - 1); setVerifyError(''); }}
              className="px-5 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all duration-200"
            >
              ← Back
            </button>
          )}
          {ownerStep < 5 ? (
            <button
              onClick={stepValidate}
              className="flex-1 bg-green-500 hover:bg-green-400 active:scale-95 text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-green-500/20"
            >
              Next →
            </button>
          ) : !user ? (
            <button
              onClick={handleSignInToSubmit}
              disabled={!confirmOwnership}
              className="flex-1 bg-green-500 hover:bg-green-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-green-500/20"
            >
              Sign in with Google to submit →
            </button>
          ) : (
            <button
              onClick={submitVerification}
              disabled={verifyLoading || !confirmOwnership}
              className="flex-1 bg-green-500 hover:bg-green-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-green-500/20"
            >
              {verifyLoading ? 'Submitting…' : 'Submit for Verification'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
