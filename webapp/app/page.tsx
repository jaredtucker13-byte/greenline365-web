'use client';

import ChatWidget from '../components/chatwidget';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a3a2a] via-[#0a1a1a] to-[#1a1a2a] text-white relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(93,254,202,0.1),transparent_50%)]"></div>
      
      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#5DFECA] to-[#22c55e] rounded-xl flex items-center justify-center">
            <span className="text-xl">🌿</span>
          </div>
          <span className="font-bold text-white">GREENLINE365</span>
        </div>
        <button className="bg-[#1a2f1a] text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-[#2a3f2a] transition-all border border-[#5DFECA]/20">
          Talk to a rep
        </button>
      </header>

      {/* Hero Section */}
      <div className="relative z-10 flex items-center justify-center min-h-[80vh] px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Status Badge */}
          <div className="inline-block">
            <span className="bg-[#1a2f1a] text-[#5DFECA] px-4 py-2 rounded-full text-xs font-medium border border-[#5DFECA]/30">
              System status: Coming online
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-6xl md:text-8xl font-bold leading-tight">
            GreenLine365<br/>
            <span className="text-white/60">Coming Soon.</span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            A smart business hub that helps local shops manage customers and marketing automatically. This is a test website while the system is being built.
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center items-center pt-4">
            <button className="bg-[#5DFECA] text-[#0a1a1a] px-8 py-3 rounded-full font-semibold hover:brightness-110 transition-all shadow-lg shadow-[#5DFECA]/20">
              Open chat
            </button>
            <button className="bg-[#1a2f1a] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#2a3f2a] transition-all border border-[#5DFECA]/20">
              Join waitlist
            </button>
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}