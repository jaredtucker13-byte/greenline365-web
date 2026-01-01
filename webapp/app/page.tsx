'use client';

import ChatWidget from '../components/chatwidget';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a1a1a] text-white">
      <div className="relative min-h-screen flex items-center justify-center px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a2f1a] via-[#0a1a1a] to-[#0a1a1a] opacity-80"></div>
        
        <div className="relative z-10 max-w-6xl mx-auto text-center space-y-8">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-[#5DFECA] to-[#22c55e] rounded-3xl flex items-center justify-center shadow-2xl shadow-[#5DFECA]/30 rotate-3">
              <span className="text-5xl rotate-[-3deg]">🌿</span>
            </div>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-[#5DFECA] to-[#4ade80] bg-clip-text text-transparent">
              GreenLine365
            </span>
          </h1>

          <p className="text-2xl md:text-3xl text-white/80 font-light max-w-3xl mx-auto leading-relaxed">
            Automate Your Business Growth.<br/>
            Turn Burnout Into Breakthroughs.
          </p>

          <div className="pt-8">
            <button className="bg-[#5DFECA] text-[#0a1a1a] px-12 py-5 rounded-2xl text-xl font-bold hover:brightness-110 transition-all shadow-2xl shadow-[#5DFECA]/30 hover:scale-105">
              Talk to a Rep
            </button>
          </div>
        </div>
      </div>

      <ChatWidget />
    </div>
  );
}