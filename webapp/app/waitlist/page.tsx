'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function WaitlistPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    company: '',
    industry: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
        setFormData({ email: '', name: '', company: '', industry: '' });
        
        // Redirect to home page after 3 seconds
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong');
      }
    } catch {
      setStatus('error');
      setMessage('Failed to join waitlist. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation back to home */}
      <nav className="absolute top-0 left-0 right-0 z-10 p-4">
        <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Home</span>
        </Link>
      </nav>

      <div className="container mx-auto px-4 py-16 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          {/* Success State - Full Screen */}
          {status === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#39FF14]/20 flex items-center justify-center">
                <svg className="w-12 h-12 text-[#39FF14]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-4">You&apos;re on the List!</h2>
              <p className="text-xl text-[#39FF14] mb-4">{message}</p>
              <p className="text-gray-400 mb-8">
                We&apos;ll notify you when it&apos;s your turn. In the meantime, explore what GreenLine365 can do for your business.
              </p>
              <p className="text-sm text-gray-500">Redirecting you to the homepage...</p>
              <div className="mt-4">
                <Link 
                  href="/" 
                  className="inline-flex items-center gap-2 text-[#39FF14] hover:underline"
                >
                  Go to Homepage Now
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-full mb-6">
                  <span className="w-2 h-2 bg-[#39FF14] rounded-full animate-pulse" />
                  <span className="text-sm text-[#39FF14] font-semibold">Limited Early Access</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Join the <span className="text-[#39FF14]">Waitlist</span>
                </h1>
                <p className="text-xl text-gray-400">
                  Get early access to GreenLine365 and be among the first to experience
                  AI-powered local business marketing.
                </p>
              </div>

              <motion.form
                onSubmit={handleSubmit}
                className="bg-[#1a1a1a] rounded-2xl p-8 border border-gray-800"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email Address <span className="text-[#39FF14]">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      data-testid="waitlist-email-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:border-[#39FF14] transition-colors text-white"
                      placeholder="you@company.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      data-testid="waitlist-name-input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:border-[#39FF14] transition-colors text-white"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      id="company"
                      data-testid="waitlist-company-input"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:border-[#39FF14] transition-colors text-white"
                      placeholder="Your Business"
                    />
                  </div>

                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium mb-2">
                      Industry
                    </label>
                    <select
                      id="industry"
                      data-testid="waitlist-industry-select"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:border-[#39FF14] transition-colors text-white"
                    >
                      <option value="">Select your industry</option>
                      <option value="restaurant">Restaurant / Food Service</option>
                      <option value="retail">Retail</option>
                      <option value="fitness">Fitness / Wellness</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="salon">Salon / Barbershop</option>
                      <option value="professional-services">Professional Services</option>
                      <option value="real-estate">Real Estate</option>
                      <option value="automotive">Automotive</option>
                      <option value="home-services">Home Services</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {message && status === 'error' && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500 text-red-500">
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    data-testid="waitlist-submit-btn"
                    className="w-full bg-[#39FF14] text-black font-bold py-4 px-6 rounded-lg hover:bg-[#32E012] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                  >
                    {status === 'loading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Joining...
                      </span>
                    ) : (
                      'Join the Waitlist'
                    )}
                  </button>
                </div>
              </motion.form>

              <div className="mt-8 text-center text-gray-500 text-sm">
                <p>🔒 We respect your privacy. No spam, ever.</p>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
