export default function PricingView({ setView, handleSubscribe, loadingSub }) {
  return (
    <div className="min-h-screen bg-[#050505] text-gray-100">
      <header className="bg-[#111111] border-b border-white/5 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={() => setView('home')}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <span className="font-semibold text-white">Choose a plan</span>
        <div className="w-16" />
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">Start your free 7-day trial</h2>
          <p className="text-gray-500 text-sm mt-2">No charge until your trial ends. Cancel anytime.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Basic card */}
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium text-gray-400">Basic</p>
              <p className="mt-1">
                <span className="text-3xl font-bold text-white">$30</span>
                <span className="text-gray-500 text-sm">/mo</span>
              </p>
            </div>
            <ul className="space-y-2.5 flex-1">
              {['Leave & reply to reviews', 'Good / Average / Bad ratings', 'Basic AI summary'].map(f => (
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
              className="w-full bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingSub ? 'Redirecting...' : 'Start free trial'}
            </button>
          </div>

          {/* Pro card */}
          <div className="bg-[#111111] border-2 border-green-500/60 rounded-2xl p-6 flex flex-col gap-4 relative shadow-[0_0_32px_rgba(34,197,94,0.1)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-full">Most popular</span>
            </div>
            <div>
              <p className="text-sm font-medium text-green-400">Pro</p>
              <p className="mt-1">
                <span className="text-3xl font-bold text-white">$40</span>
                <span className="text-gray-500 text-sm">/mo</span>
              </p>
            </div>
            <ul className="space-y-2.5 flex-1">
              {['Everything in Basic', 'Advanced AI insights', 'Analytics dashboard'].map(f => (
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
              className="w-full bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/20"
            >
              {loadingSub ? 'Redirecting...' : 'Start free trial'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
