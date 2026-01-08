'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function WaitlistPage() {
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
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to join waitlist. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Join the <span className="text-[#39FF14]">Waitlist</span>
            </h1>
            <p className="text-xl text-gray-400">
              Get early access to GreenLine365 and be among the first to experience
              AI-powered business planning.
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
                  Full Name
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

              <div>
                <label htmlFor="company" className="block text-sm font-medium mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:border-[#39FF14] transition-colors"
                  placeholder="Your Company"
                />
              </div>

              <div>
                <label htmlFor="industry" className="block text-sm font-medium mb-2">
                  Industry
                </label>
                <select
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:border-[#39FF14] transition-colors"
                >
                  <option value="">Select an industry</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="retail">Retail</option>
                  <option value="fitness">Fitness</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="professional-services">Professional Services</option>
                  <option value="real-estate">Real Estate</option>
                  <option value="other">Other</option>
                </select>
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
                {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
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
                Check your email for updates and early access information!
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
