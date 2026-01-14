'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

type Status = 'idle' | 'loading' | 'verify' | 'verifying' | 'success' | 'error';

export default function WaitlistPage() {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    company: '',
    industry: '',
  });
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

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
        // Show verification step
        setStatus('verify');
        setMessage('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong');
      }
    } catch {
      setStatus('error');
      setMessage('Failed to join waitlist. Please try again.');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6) {
      setMessage('Please enter the 6-digit code');
      return;
    }

    setStatus('verifying');
    setMessage('');

    try {
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email, 
          code: verificationCode 
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
      } else {
        setStatus('verify'); // Stay on verify screen
        setMessage(data.error || 'Invalid code. Please try again.');
      }
    } catch {
      setStatus('verify');
      setMessage('Verification failed. Please try again.');
    }
  };

  const handleResendEmail = async () => {
    setMessage('');
    setStatus('loading');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('verify');
        setMessage('Verification email resent! Check your inbox (and spam folder).');
      } else {
        const data = await response.json();
        setStatus('verify');
        setMessage(data.error || 'Failed to resend. Please try again.');
      }
    } catch {
      setStatus('verify');
      setMessage('Failed to resend email.');
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
          {/* Success State */}
          {status === 'success' && (
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
              <h2 className="text-3xl font-bold mb-4">You&apos;re Verified!</h2>
              <p className="text-xl text-[#39FF14] mb-4">{message}</p>
              <p className="text-gray-400 mb-8">
                You&apos;re officially on the GreenLine365 waitlist. We&apos;ll notify you when it&apos;s your turn!
              </p>
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#39FF14] text-black font-bold rounded-lg hover:bg-[#32E012] transition-colors"
              >
                Return to Homepage
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </motion.div>
          )}

          {/* Verification Step */}
          {status === 'verify' || status === 'verifying' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#39FF14]/10 border-2 border-[#39FF14]/30 flex items-center justify-center">
                <svg className="w-10 h-10 text-[#39FF14]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              
              <h2 className="text-3xl font-bold mb-2">Check Your Email</h2>
              <p className="text-gray-400 mb-2">
                We sent a verification email to:
              </p>
              <p className="text-[#39FF14] font-semibold text-lg mb-6">
                {formData.email}
              </p>

              {/* Spam Warning */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="text-yellow-400 font-semibold">Check your spam folder!</p>
                    <p className="text-yellow-400/70 text-sm">
                      If you don&apos;t see the email in your inbox, it may be in your spam or junk folder.
                    </p>
                  </div>
                </div>
              </div>

              {/* Code Entry Form */}
              <form onSubmit={handleVerifyCode} className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800 mb-6">
                <p className="text-white/80 mb-4">Enter the 6-digit code from your email:</p>
                
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-4 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:border-[#39FF14] transition-colors text-white text-center text-3xl tracking-[0.5em] font-mono mb-4"
                  data-testid="verification-code-input"
                />

                {message && (
                  <p className={`text-sm mb-4 ${message.includes('resent') ? 'text-green-400' : 'text-red-400'}`}>
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'verifying' || verificationCode.length !== 6}
                  className="w-full bg-[#39FF14] text-black font-bold py-4 px-6 rounded-lg hover:bg-[#32E012] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="verify-code-btn"
                >
                  {status === 'verifying' ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    'Verify Code'
                  )}
                </button>
              </form>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
                <button 
                  onClick={handleResendEmail}
                  className="text-[#39FF14] hover:underline"
                >
                  Resend verification email
                </button>
                <span className="text-gray-600 hidden sm:inline">|</span>
                <button 
                  onClick={() => {
                    setStatus('idle');
                    setMessage('');
                    setVerificationCode('');
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  Use a different email
                </button>
              </div>
            </motion.div>
          ) : status !== 'success' && (
            /* Initial Form */
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
