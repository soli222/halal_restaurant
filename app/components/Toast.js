export default function Toast({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-5 py-3 rounded-2xl text-sm font-medium shadow-xl backdrop-blur-sm transition-all duration-300 pointer-events-auto ${
            t.type === 'error'
              ? 'bg-red-500/90 text-white'
              : 'bg-[#1a1a1a] text-green-400 border border-green-500/20'
          }`}
        >
          {t.type === 'error' ? '⚠ ' : '✓ '}{t.message}
        </div>
      ))}
    </div>
  );
}
