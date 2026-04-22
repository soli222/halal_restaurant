export default function PostOnboardingSubscription({ handleSubscribe, loadingSub, completeOnboarding }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-100">
      <main className="max-w-lg mx-auto px-5 py-16 space-y-10">
        {/* Congrats header */}
        <div className="text-center space-y-3">
          <div className="text-5xl">🎉</div>
          <h2 className="text-2xl font-bold text-white">Verification Submitted!</h2>
          <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
            Our team will review your submission within 1–2 business days.
            In the meantime, choose a plan to start your free trial.
          </p>
        </div>

        {/* Trial banner */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl px-5 py-4 text-center">
          <p className="text-green-400 font-semibold text-sm">🎁 7 days free — no charge until your trial ends. Cancel anytime.</p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Basic */}
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium text-gray-400">Basic</p>
              <p className="mt-1 flex items-end gap-1">
                <span className="text-3xl font-bold text-white">$30</span>
                <span className="text-gray-500 text-sm pb-0.5">/mo</span>
              </p>
              <p className="text-xs text-green-400 mt-1">7-day free trial included</p>
            </div>
            <ul className="space-y-2.5 flex-1">
              {['List your restaurant', 'Respond to customer reviews', 'Basic AI review summary', 'Analytics dashboard'].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe('basic')}
              disabled={loadingSub}
              className="w-full bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 disabled:opacity-50"
            >
              {loadingSub ? 'Redirecting…' : 'Start free trial'}
            </button>
          </div>

          {/* Pro */}
          <div className="bg-[#111111] border-2 border-green-500/60 rounded-2xl p-6 flex flex-col gap-4 relative shadow-[0_0_32px_rgba(34,197,94,0.1)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-full">Most popular</span>
            </div>
            <div>
              <p className="text-sm font-medium text-green-400">Pro</p>
              <p className="mt-1 flex items-end gap-1">
                <span className="text-3xl font-bold text-white">$40</span>
                <span className="text-gray-500 text-sm pb-0.5">/mo</span>
              </p>
              <p className="text-xs text-green-400 mt-1">7-day free trial included</p>
            </div>
            <ul className="space-y-2.5 flex-1">
              {['Everything in Basic', 'Advanced AI insights & sentiment', 'Priority verification review', 'Featured placement in search'].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe('pro')}
              disabled={loadingSub}
              className="w-full bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 disabled:opacity-50 shadow-lg shadow-green-500/20"
            >
              {loadingSub ? 'Redirecting…' : 'Start free trial'}
            </button>
          </div>
        </div>

        {/* Skip */}
        <div className="text-center">
          <button
            onClick={completeOnboarding}
            className="text-sm text-gray-500 hover:text-gray-300 underline underline-offset-2 transition-colors"
          >
            Skip for now, I'll decide later
          </button>
        </div>
      </main>
    </div>
  );
}
