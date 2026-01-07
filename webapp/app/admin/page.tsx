import CommandCenter from '../components/CommandCenter';
import Link from 'next/link';

export const metadata = {
  title: 'Command Center - GreenLine365 Admin',
  description: 'Manage bookings, leads, and track business performance.',
};

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#050a08]">
      {/* Admin Navigation */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-xl font-bold">
                <span className="text-white">Green</span>
                <span className="text-emerald-400">Line365</span>
              </Link>
              <span className="text-gray-600">|</span>
              <span className="text-emerald-400 text-sm font-medium">Command Center</span>
            </div>
            <Link 
              href="/"
              className="text-gray-400 hover:text-white transition text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Site
            </Link>
          </div>
        </div>
      </nav>

      {/* Command Center Component */}
      <CommandCenter />
    </div>
  );
}
