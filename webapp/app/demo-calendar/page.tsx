'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';

// Types
interface Industry {
  id: string;
  name: string;
  default_demo_profile_id: string;
  icon: string;
  description: string;
}

// Fallback industries if DB fetch fails
const fallbackIndustries: Industry[] = [
  { id: 'technology', name: 'Technology & Software', icon: '💻', default_demo_profile_id: 'greenline365', description: '' },
  { id: 'food_beverage', name: 'Food & Beverage', icon: '🍽️', default_demo_profile_id: 'tampa-bay-bakery', description: '' },
  { id: 'automotive', name: 'Automotive', icon: '🚗', default_demo_profile_id: 'miami-auto-group', description: '' },
  { id: 'healthcare', name: 'Healthcare & Wellness', icon: '🏥', default_demo_profile_id: 'orlando-med-spa', description: '' },
  { id: 'fitness', name: 'Fitness & Sports', icon: '💪', default_demo_profile_id: 'jacksonville-fitness', description: '' },
  { id: 'real_estate', name: 'Real Estate', icon: '🏠', default_demo_profile_id: 'st-pete-realty', description: '' },
  { id: 'retail', name: 'Retail & E-commerce', icon: '🛍️', default_demo_profile_id: 'greenline365', description: '' },
  { id: 'professional_services', name: 'Professional Services', icon: '💼', default_demo_profile_id: 'greenline365', description: '' },
  { id: 'hospitality', name: 'Hospitality & Tourism', icon: '🏨', default_demo_profile_id: 'greenline365', description: '' },
  { id: 'education', name: 'Education & Training', icon: '📚', default_demo_profile_id: 'greenline365', description: '' },
  { id: 'other', name: 'Other', icon: '🔧', default_demo_profile_id: 'greenline365', description: '' },
];

export default function DemoCalendarPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [industries, setIndustries] = useState<Industry[]>(fallbackIndustries);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    website: '',
    industry: '',
    phone: '',
  });

  // Load industries from Supabase
  useEffect(() => {
    async function loadIndustries() {
      const { data, error } = await supabase
        .from('industries')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (data && !error && data.length > 0) {
        setIndustries(data);
      }
    }
    loadIndustries();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleIndustrySelect = (industryId: string) => {
    setFormData({ ...formData, industry: industryId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Find the matching demo profile based on industry
      const selectedIndustry = industries.find(i => i.id === formData.industry);
      const demoProfileId = selectedIndustry?.default_demo_profile_id || 'greenline365';

      // First, create a demo_request record (for tracking + future scraping)
      await supabase
        .from('demo_requests')
        .insert({
          email: formData.email,
          name: formData.name,
          company: formData.company,
          industry: formData.industry,
          website_url: formData.website || null,
          selected_demo_profile_id: demoProfileId,
          created_at: new Date().toISOString(),
        });

      // Create demo session in Supabase
      const { data: session, error } = await supabase
        .from('demo_sessions')
        .insert({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          website: formData.website || null,
          industry: formData.industry,
          phone: formData.phone || null,
          demo_profile_id: demoProfileId,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating demo session:', error);
        // Fallback: create a mock session ID if database fails
        const mockSessionId = `demo-${Date.now()}`;
        router.push(`/demo/${mockSessionId}?profile=${demoProfileId}`);
        return;
      }

      // Redirect to demo experience
      router.push(`/demo/${session.id}`);
    } catch (err) {
      console.error('Error:', err);
      // Fallback redirect
      const mockSessionId = `demo-${Date.now()}`;
      router.push(`/demo/${mockSessionId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 py-12">
      <div className="max-w-2xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Book Your <span className="text-emerald-400">Demo</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/60"
          >
            Tell us about your business and we'll customize your demo experience.
          </motion.p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition ${
                step >= s ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white/40'
              }`}>
                {s}
              </div>
              <span className={`text-sm ${step >= s ? 'text-white' : 'text-white/40'}`}>
                {s === 1 ? 'Your Info' : 'Industry'}
              </span>
              {s < 2 && <div className="w-12 h-0.5 bg-white/10" />}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-white/10 rounded-2xl p-8"
        >
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
                    placeholder="john@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Company Name *</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
                    placeholder="Acme Inc"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Business Website URL (Optional)</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
                    placeholder="https://company.com"
                  />
                  <p className="text-xs text-white/40 mt-1">We'll use this to personalize your demo experience</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (formData.name && formData.email && formData.company) {
                      setStep(2);
                    }
                  }}
                  disabled={!formData.name || !formData.email || !formData.company}
                  className="w-full py-4 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-4">Select Your Industry *</label>
                  <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2">
                    {industries.map((industry) => (
                      <button
                        key={industry.id}
                        type="button"
                        onClick={() => handleIndustrySelect(industry.id)}
                        className={`p-4 rounded-xl border text-left transition ${
                          formData.industry === industry.id
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                            : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20'
                        }`}
                      >
                        <span className="text-xl mr-2">{industry.icon}</span>
                        <span className="text-sm">{industry.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Phone (Optional)</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!formData.industry || loading}
                    className="flex-1 py-4 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Start Demo'
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8 text-white/40 text-sm"
        >
          <p>🔒 Your information is secure and will never be shared.</p>
        </motion.div>
      </div>
    </div>
  );
}
