'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#1a1f1d] to-[#0a0f0d] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">📡</div>
        <h1 className="text-3xl font-bold text-white mb-4">You're Offline</h1>
        <p className="text-white/60 mb-8">
          Don't worry! Your work is saved locally. When you're back online, 
          everything will sync automatically.
        </p>
        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 rounded-xl bg-[#84A98C] text-white font-medium hover:bg-[#84A98C]/90 transition"
          >
            Try Again
          </button>
          <p className="text-sm text-white/40">
            Tip: You can still write and edit. Changes save to your device.
          </p>
        </div>
      </div>
    </div>
  );
}
