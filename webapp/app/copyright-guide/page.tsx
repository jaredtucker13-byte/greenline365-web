import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Copyright Guide for Content Creators | GreenLine365',
  description: 'Comprehensive guide to copyright law for content creators. Understand your rights, fair use, licensing, and how to protect your content.',
};

const jurisdictions = [
  {
    name: 'United States',
    flag: '🇺🇸',
    duration: 'Life + 70 years',
    registration: 'Required for lawsuits',
    fairUse: 'Four-factor test (flexible)',
    highlights: [
      'DMCA takedown for online infringement',
      'Registration needed for statutory damages',
      'Limited moral rights (VARA for visual art)',
      'Work-for-hire: 95 years from publication',
    ],
  },
  {
    name: 'United Kingdom',
    flag: '🇬🇧',
    duration: 'Life + 70 years',
    registration: 'Not required',
    fairUse: 'Fair dealing (narrower exceptions)',
    highlights: [
      'Moral rights recognized (paternity, integrity)',
      'Specific exceptions for research, criticism, parody',
      'Database rights protection',
      'Collective licensing common',
    ],
  },
  {
    name: 'European Union',
    flag: '🇪🇺',
    duration: 'Life + 70 years',
    registration: 'Not required',
    fairUse: 'Limited exceptions (no US-style fair use)',
    highlights: [
      'Article 17: Platform liability for unlicensed content',
      'Text/data mining exceptions for research',
      'Press publisher rights',
      'Sui generis database rights',
    ],
  },
  {
    name: 'Canada',
    flag: '🇨🇦',
    duration: 'Life + 70 years',
    registration: 'Not required',
    fairUse: 'Fair dealing (expanding scope)',
    highlights: [
      'Notice-and-notice system (not takedown)',
      'Parody and satire exceptions',
      'Moral rights can be waived',
      'Collective societies (SOCAN, Re:Sound)',
    ],
  },
];

const licenseTypes = [
  {
    name: 'CC0 (Public Domain)',
    icon: '🌐',
    description: 'No rights reserved - completely free to use',
    canDo: ['Commercial use', 'Modify', 'Distribute', 'No attribution needed'],
    cantDo: [],
  },
  {
    name: 'CC BY (Attribution)',
    icon: '👤',
    description: 'Free to use with credit to creator',
    canDo: ['Commercial use', 'Modify', 'Distribute'],
    cantDo: ['Use without attribution'],
  },
  {
    name: 'CC BY-SA (ShareAlike)',
    icon: '🔄',
    description: 'Derivatives must use same license',
    canDo: ['Commercial use', 'Modify', 'Distribute'],
    cantDo: ['Change license on derivatives'],
  },
  {
    name: 'CC BY-NC (NonCommercial)',
    icon: '🚫💰',
    description: 'No commercial use allowed',
    canDo: ['Modify', 'Distribute', 'Personal use'],
    cantDo: ['Commercial use'],
  },
  {
    name: 'All Rights Reserved',
    icon: '©️',
    description: 'Traditional copyright - permission required',
    canDo: ['Request permission', 'Fair use (limited)'],
    cantDo: ['Copy', 'Modify', 'Distribute without permission'],
  },
];

export default function CopyrightGuidePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00FF88] to-[#00CC6A] flex items-center justify-center">
                <span className="text-black font-bold">G</span>
              </div>
              <span className="text-white font-semibold">GreenLine365</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/terms" className="text-white/60 hover:text-white text-sm transition">Terms</Link>
              <Link href="/privacy" className="text-white/60 hover:text-white text-sm transition">Privacy</Link>
              <Link href="/login" className="px-4 py-2 bg-[#00FF88]/10 text-[#00FF88] rounded-lg text-sm hover:bg-[#00FF88]/20 transition">
                Sign In
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Copyright Guide for <span className="text-[#00FF88]">Content Creators</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Understand your rights, protect your work, and use others' content responsibly. 
            Essential knowledge for bloggers, marketers, and business owners.
          </p>
        </div>
      </section>

      {/* Quick Overview */}
      <section className="py-16 px-6 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">⚡ Quick Overview</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="text-3xl mb-4">✅</div>
              <h3 className="text-lg font-semibold text-white mb-2">What's Protected</h3>
              <ul className="text-sm text-white/60 space-y-2">
                <li>• Original written content</li>
                <li>• Photos and images</li>
                <li>• Music and audio</li>
                <li>• Videos and films</li>
                <li>• Software code</li>
                <li>• Artistic works</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="text-3xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-white mb-2">What's NOT Protected</h3>
              <ul className="text-sm text-white/60 space-y-2">
                <li>• Facts and data</li>
                <li>• Ideas and concepts</li>
                <li>• Common phrases</li>
                <li>• Government works (US)</li>
                <li>• Expired copyrights</li>
                <li>• Works in public domain</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Content</h3>
              <ul className="text-sm text-white/60 space-y-2">
                <li>• Limited/no protection in most jurisdictions</li>
                <li>• Human input may add protection</li>
                <li>• Check AI provider terms</li>
                <li>• Document your contributions</li>
                <li>• Laws still evolving</li>
                <li>• Consult legal counsel for important work</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Jurisdiction Comparison */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">🌍 Copyright by Jurisdiction</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {jurisdictions.map((j) => (
              <div key={j.name} className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{j.flag}</span>
                  <h3 className="text-xl font-semibold text-white">{j.name}</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-white/40 text-xs">Duration</p>
                    <p className="text-white/80">{j.duration}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Registration</p>
                    <p className="text-white/80">{j.registration}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-white/40 text-xs">Fair Use/Dealing</p>
                    <p className="text-white/80">{j.fairUse}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <p className="text-white/40 text-xs mb-2">Key Points</p>
                  <ul className="text-xs text-white/60 space-y-1">
                    {j.highlights.map((h, i) => (
                      <li key={i}>• {h}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* License Types */}
      <section className="py-16 px-6 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">📜 Understanding Licenses</h2>
          
          <div className="space-y-4">
            {licenseTypes.map((license) => (
              <div key={license.name} className="p-5 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{license.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{license.name}</h3>
                    <p className="text-sm text-white/60 mb-3">{license.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {license.canDo.map((item, i) => (
                        <span key={i} className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">
                          ✓ {item}
                        </span>
                      ))}
                      {license.cantDo.map((item, i) => (
                        <span key={i} className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs">
                          ✗ {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Best Practices */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">✨ Best Practices for Content Creators</h2>
          
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#00FF88]/10 to-transparent border border-[#00FF88]/20">
              <h3 className="text-lg font-semibold text-[#00FF88] mb-3">When Using Others' Content</h3>
              <ul className="text-sm text-white/70 space-y-2">
                <li>✓ Always check the license before using any content</li>
                <li>✓ Provide proper attribution as required</li>
                <li>✓ Keep records of permissions and licenses</li>
                <li>✓ Use royalty-free or Creative Commons content when possible</li>
                <li>✓ When in doubt, ask for permission</li>
                <li>✓ Consider fair use factors but don't rely on them blindly</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">When Protecting Your Content</h3>
              <ul className="text-sm text-white/70 space-y-2">
                <li>✓ Add copyright notices to your work (© 2025 Your Name)</li>
                <li>✓ Document creation dates and keep original files</li>
                <li>✓ Consider registration (especially US) for valuable works</li>
                <li>✓ Use watermarks for visual content</li>
                <li>✓ Include clear terms of use on your website</li>
                <li>✓ Monitor for unauthorized use</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20">
              <h3 className="text-lg font-semibold text-purple-400 mb-3">AI-Generated Content Guidelines</h3>
              <ul className="text-sm text-white/70 space-y-2">
                <li>✓ Add substantial human creative input when possible</li>
                <li>✓ Review AI outputs for potential copied content</li>
                <li>✓ Check AI provider terms regarding ownership</li>
                <li>✓ Document your prompts and creative direction</li>
                <li>✓ Consider disclosing AI assistance for transparency</li>
                <li>✓ Don't assume AI content is automatically protectable</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-16 px-6 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <h3 className="text-lg font-semibold text-amber-400 mb-3">⚠️ Legal Disclaimer</h3>
            <p className="text-sm text-white/60">
              This guide provides general information only and does not constitute legal advice. 
              Copyright law varies by jurisdiction and is subject to change. For specific legal 
              questions or disputes, consult a qualified attorney in your jurisdiction.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Create Content <span className="text-[#00FF88]">Confidently</span>?
          </h2>
          <p className="text-white/60 mb-8">
            Use GreenLine365's built-in copyright tools to check your content and generate proper attributions.
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              href="/login"
              className="px-8 py-3 bg-[#00FF88] text-black font-semibold rounded-xl hover:bg-[#00FF88]/90 transition"
            >
              Get Started Free
            </Link>
            <Link 
              href="/terms"
              className="px-8 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition"
            >
              View Terms
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00FF88] to-[#00CC6A] flex items-center justify-center">
                <span className="text-black font-bold text-sm">G</span>
              </div>
              <span className="text-white/60 text-sm">© 2025 GreenLine365. All rights reserved.</span>
            </div>
            <div className="flex gap-6 text-sm text-white/40">
              <Link href="/terms" className="hover:text-white transition">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
              <Link href="/copyright-guide" className="hover:text-white transition">Copyright Guide</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
