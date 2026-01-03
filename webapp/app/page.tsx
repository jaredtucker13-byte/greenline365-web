import Link from 'next/link';

function InstantAssistantHint() {
  return (
    <div className="absolute bottom-6 right-6 z-20 hidden md:block">
      <div className="rounded-full bg-emerald-900/60 px-3 py-2 text-sm text-emerald-100">
        Ask the assistant
      </div>
    </div>
  );
}

function ChatWidget() {
  return (
    <div className="absolute bottom-6 left-6 z-20">
      <div className="w-12 h-12 rounded-full bg-emerald-500/90 flex items-center justify-center text-white text-sm font-semibold">
        ☰
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#032016] via-[#020b05] to-[#055a24] relative z-10 p-6 flex justify-between items-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(93,254,202,0.03)_0,_transparent_60%)]"></div>
      
      <div className="relative z-10 p-6 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="mb-4 rounded-full bg-emerald-900/40 px-4 py-1 text-xs uppercase tracking-wide text-emerald-300">
            System status: Coming online
          </div>

          <h1 className="mb-4 text-4xl font-bold sm:text-6xl text-center">
            GreenLine365 <br /> Coming Soon.
          </h1>

          <p className="mb-8 max-w-2xl text-sm sm:text-base text-gray-200 text-center">
            A smart business hub that helps local shops manage customers and marketing
            automatically. This is a test website while the system is being built.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/waitlist"
              className="bg-[#1a2f1a] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#2a3f2a] transition-all border border-[#5DFECA]/20"
            >
              Join waitlist
            </Link>

            <Link
              href="/newsletter"
              className="border border-emerald-400 px-6 py-2 rounded-full text-sm font-medium text-emerald-300 hover:bg-emerald-900/40"
            >
              Join newsletter
            </Link>
          </div>
        </div>
      </div>

      <InstantAssistantHint />
      <ChatWidget />
    </main>
  );
}