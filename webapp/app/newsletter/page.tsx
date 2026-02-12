'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function NewsletterPage() {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
        setFormData({ email: '', name: '' });
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to subscribe. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-20">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Subscribe to our <span className="text-[#39FF14]">Newsletter</span>
            </h1>
            <p className="text-xl text-gray-400">
              Get weekly insights, tips, and updates on AI-powered business growth
              strategies delivered straight to your inbox.
            </p>
          </div>

          <motion.form
            onSubmit={handleSubmit}
            className="bg-[#1a1a1a] rounded-lg p-8 border border-gray-800"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:border-[#39FF14] transition-colors"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:border-[#39FF14] transition-colors"
                  placeholder="John Doe"
                />
              </div>

              {message && (
                <div
                  className={`p-4 rounded-lg ${
                    status === 'success'
                      ? 'bg-[#39FF14]/10 border border-[#39FF14] text-[#39FF14]'
                      : 'bg-red-500/10 border border-red-500 text-red-500'
                  }`}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-[#39FF14] text-black font-bold py-3 px-6 rounded-lg hover:bg-[#0CE293] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>
          </motion.form>

          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-center"
            >
              <p className="text-gray-400">
                🎉 You&apos;re subscribed! Expect great content coming your way.
              </p>
            </motion.div>
          )}

          <div className="mt-12 text-center text-sm text-gray-500">
            <p>
              We respect your privacy. Unsubscribe anytime with a single click.
              <br />
              No spam, ever.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
