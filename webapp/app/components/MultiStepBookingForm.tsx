'use client';

import { useState } from 'react';
import { createBooking } from '@/lib/supabase/client';

// Validation helpers
const validators = {
  email: (value: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) return 'Email is required';
    if (!regex.test(value)) return 'Please enter a valid email address';
    return null;
  },
  phone: (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    if (!value) return null; // Phone is optional
    if (digits.length < 10) return 'Phone number must be at least 10 digits';
    if (digits.length > 15) return 'Phone number is too long';
    return null;
  },
  name: (value: string) => {
    if (!value) return 'Name is required';
    if (value.trim().length < 2) return 'Please enter your full name';
    if (!/^[a-zA-Z\s'-]+$/.test(value)) return 'Name should only contain letters';
    return null;
  },
  businessName: (value: string) => {
    if (!value) return 'Business name is required';
    if (value.trim().length < 2) return 'Please enter a valid business name';
    return null;
  },
};

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  industry: string;
  needs: string[];
  notes: string;
  preferredDateTime: string;
}

const needsOptions = [
  { value: 'new-site', label: 'New website' },
  { value: 'redesign', label: 'Redesign / refresh' },
  { value: 'seo', label: 'SEO help' },
  { value: 'ads', label: 'Google/Facebook ads' },
  { value: 'automation', label: 'Automation / AI' },
  { value: 'booking-system', label: 'Booking system' },
  { value: 'consulting', label: 'Consulting' },
];

interface MultiStepBookingFormProps {
  compact?: boolean;
}

export default function MultiStepBookingForm({ compact = false }: MultiStepBookingFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    businessName: '',
    industry: '',
    needs: [],
    notes: '',
    preferredDateTime: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailVerified, setEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const totalSteps = 4;

  const updateField = (field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (stepNum: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNum === 1) {
      const nameError = validators.name(formData.fullName);
      const emailError = validators.email(formData.email);
      const phoneError = validators.phone(formData.phone);

      if (nameError) newErrors.fullName = nameError;
      if (emailError) newErrors.email = emailError;
      if (phoneError) newErrors.phone = phoneError;
      if (!emailVerified) newErrors.email = 'Please verify your email address';
    }

    if (stepNum === 2) {
      const businessError = validators.businessName(formData.businessName);
      if (businessError) newErrors.businessName = businessError;
    }

    if (stepNum === 3) {
      if (formData.needs.length === 0) {
        newErrors.needs = 'Please select at least one service';
      }
      if (!formData.preferredDateTime) {
        newErrors.preferredDateTime = 'Please select a date and time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendVerificationCode = async () => {
    const emailError = validators.email(formData.email);
    if (emailError) {
      setErrors((prev) => ({ ...prev, email: emailError }));
      return;
    }

    setSendingCode(true);
    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, action: 'send' }),
      });

      const data = await response.json();
      if (data.success) {
        setCodeSent(true);
        // In dev mode, auto-fill the code for testing
        if (data.devCode) {
          setVerificationCode(data.devCode);
        }
      } else {
        setErrors((prev) => ({ ...prev, email: data.error || 'Failed to send code' }));
      }
    } catch {
      setErrors((prev) => ({ ...prev, email: 'Failed to send verification code' }));
    } finally {
      setSendingCode(false);
    }
  };

  const verifyCode = async () => {
    if (verificationCode.length !== 6) {
      setErrors((prev) => ({ ...prev, verificationCode: 'Please enter the 6-digit code' }));
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, action: 'verify', code: verificationCode }),
      });

      const data = await response.json();
      if (data.verified) {
        setEmailVerified(true);
        setErrors((prev) => ({ ...prev, email: '', verificationCode: '' }));
      } else {
        setErrors((prev) => ({ ...prev, verificationCode: data.error || 'Invalid code' }));
      }
    } catch {
      setErrors((prev) => ({ ...prev, verificationCode: 'Verification failed' }));
    } finally {
      setVerifying(false);
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, totalSteps));
    }
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const toggleNeed = (value: string) => {
    const currentNeeds = formData.needs;
    const newNeeds = currentNeeds.includes(value)
      ? currentNeeds.filter((n) => n !== value)
      : [...currentNeeds, value];
    updateField('needs', newNeeds);
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    setIsSubmitting(true);
    try {
      await createBooking({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone || undefined,
        business_name: formData.businessName,
        industry: formData.industry || undefined,
        needs: formData.needs,
        notes: formData.notes || undefined,
        preferred_datetime: formData.preferredDateTime,
        source: 'greenline365-booking-form',
      });
      setIsComplete(true);
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to submit booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  if (isComplete) {
    return (
      <div className={`text-center ${compact ? 'py-6' : 'py-12'}`}>
        <div className={`${compact ? 'w-14 h-14 mb-4' : 'w-20 h-20 mb-6'} mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center`}>
          <svg className={`${compact ? 'w-7 h-7' : 'w-10 h-10'} text-emerald-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className={`${compact ? 'text-lg' : 'text-2xl'} font-bold text-white mb-2`}>Booking Confirmed!</h2>
        <p className={`${compact ? 'text-sm' : ''} text-gray-300 mb-1`}>Thank you, {formData.fullName.split(' ')[0]}!</p>
        <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-400`}>We&apos;ll send confirmation details to {formData.email}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className={compact ? 'mb-4' : 'mb-8'}>
        <div className="flex justify-between mb-2">
          {['Contact', 'Business', 'Services & Time', 'Confirm'].map((label, i) => (
            <div key={label} className="flex flex-col items-center flex-1">
              <div
                className={`${compact ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'} rounded-full flex items-center justify-center font-medium transition-all ${
                  i + 1 < step
                    ? 'bg-emerald-500 text-black'
                    : i + 1 === step
                    ? 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500'
                    : 'bg-gray-800 text-gray-500'
                }`}
              >
                {i + 1 < step ? (
                  <svg className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {!compact && (
                <span className={`mt-2 text-xs hidden sm:block ${i + 1 <= step ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {label}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Contact Information */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Contact Information</h2>
            <p className="text-gray-400">We&apos;ll use this to send your booking confirmation.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              placeholder="John Smith"
              className={`w-full p-4 rounded-xl bg-gray-800/50 border text-white placeholder:text-gray-500 focus:ring-2 focus:ring-emerald-500 outline-none transition ${
                errors.fullName ? 'border-red-500' : 'border-gray-700 focus:border-emerald-500'
              }`}
            />
            {errors.fullName && <p className="mt-1 text-sm text-red-400">{errors.fullName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address *</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  updateField('email', e.target.value);
                  setEmailVerified(false);
                  setCodeSent(false);
                }}
                placeholder="john@company.com"
                disabled={emailVerified}
                className={`flex-1 p-4 rounded-xl bg-gray-800/50 border text-white placeholder:text-gray-500 focus:ring-2 focus:ring-emerald-500 outline-none transition disabled:opacity-60 ${
                  errors.email ? 'border-red-500' : emailVerified ? 'border-emerald-500' : 'border-gray-700 focus:border-emerald-500'
                }`}
              />
              {!emailVerified && (
                <button
                  type="button"
                  onClick={sendVerificationCode}
                  disabled={sendingCode || !formData.email}
                  className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition disabled:opacity-50 text-sm font-medium whitespace-nowrap"
                >
                  {sendingCode ? 'Sending...' : codeSent ? 'Resend' : 'Verify'}
                </button>
              )}
              {emailVerified && (
                <div className="flex items-center px-4 text-emerald-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}

            {codeSent && !emailVerified && (
              <div className="mt-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <p className="text-sm text-gray-300 mb-3">Enter the 6-digit code sent to your email:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="flex-1 p-3 rounded-lg bg-gray-900 border border-gray-600 text-white text-center text-lg tracking-widest font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={verifyCode}
                    disabled={verifying || verificationCode.length !== 6}
                    className="px-6 py-2 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition disabled:opacity-50"
                  >
                    {verifying ? 'Verifying...' : 'Confirm'}
                  </button>
                </div>
                {errors.verificationCode && <p className="mt-2 text-sm text-red-400">{errors.verificationCode}</p>}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number (optional)</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField('phone', formatPhone(e.target.value))}
              placeholder="(555) 555-5555"
              className={`w-full p-4 rounded-xl bg-gray-800/50 border text-white placeholder:text-gray-500 focus:ring-2 focus:ring-emerald-500 outline-none transition ${
                errors.phone ? 'border-red-500' : 'border-gray-700 focus:border-emerald-500'
              }`}
            />
            {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone}</p>}
          </div>

          <button
            type="button"
            onClick={nextStep}
            className="w-full py-4 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Business Information */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">About Your Business</h2>
            <p className="text-gray-400">Help us understand your needs better.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Business Name *</label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => updateField('businessName', e.target.value)}
              placeholder="Acme Corporation"
              className={`w-full p-4 rounded-xl bg-gray-800/50 border text-white placeholder:text-gray-500 focus:ring-2 focus:ring-emerald-500 outline-none transition ${
                errors.businessName ? 'border-red-500' : 'border-gray-700 focus:border-emerald-500'
              }`}
            />
            {errors.businessName && <p className="mt-1 text-sm text-red-400">{errors.businessName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Industry (optional)</label>
            <input
              type="text"
              value={formData.industry}
              onChange={(e) => updateField('industry', e.target.value)}
              placeholder="e.g., Home Services, Healthcare, Retail"
              className="w-full p-4 rounded-xl bg-gray-800/50 border border-gray-700 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={prevStep}
              className="flex-1 py-4 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 transition"
            >
              Back
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="flex-1 py-4 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Services & Scheduling */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Services & Scheduling</h2>
            <p className="text-gray-400">What can we help you with?</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">What do you need? *</label>
            <div className="grid grid-cols-2 gap-2">
              {needsOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleNeed(option.value)}
                  className={`p-3 rounded-xl border text-left text-sm transition-all flex items-center gap-2 ${
                    formData.needs.includes(option.value)
                      ? 'border-emerald-500 bg-emerald-500/10 text-white'
                      : 'border-gray-700 bg-gray-800/30 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                    formData.needs.includes(option.value) ? 'border-emerald-500 bg-emerald-500' : 'border-gray-600'
                  }`}>
                    {formData.needs.includes(option.value) && (
                      <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  {option.label}
                </button>
              ))}
            </div>
            {errors.needs && <p className="mt-2 text-sm text-red-400">{errors.needs}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Date & Time *</label>
            <input
              type="datetime-local"
              value={formData.preferredDateTime}
              onChange={(e) => updateField('preferredDateTime', e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className={`w-full p-4 rounded-xl bg-gray-800/50 border text-white focus:ring-2 focus:ring-emerald-500 outline-none transition ${
                errors.preferredDateTime ? 'border-red-500' : 'border-gray-700 focus:border-emerald-500'
              }`}
            />
            {errors.preferredDateTime && <p className="mt-1 text-sm text-red-400">{errors.preferredDateTime}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Additional Notes (optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={3}
              placeholder="Any specific requirements or questions..."
              className="w-full p-4 rounded-xl bg-gray-800/50 border border-gray-700 text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none transition resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={prevStep} className="flex-1 py-4 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 transition">
              Back
            </button>
            <button type="button" onClick={nextStep} className="flex-1 py-4 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition">
              Review
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 4 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Review & Confirm</h2>
            <p className="text-gray-400">Please verify your information before submitting.</p>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700 space-y-4">
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between border-b border-gray-700 pb-3">
                <span className="text-gray-400">Name</span>
                <span className="text-white font-medium">{formData.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-3">
                <span className="text-gray-400">Email</span>
                <span className="text-white font-medium flex items-center gap-2">
                  {formData.email}
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              </div>
              {formData.phone && (
                <div className="flex justify-between border-b border-gray-700 pb-3">
                  <span className="text-gray-400">Phone</span>
                  <span className="text-white font-medium">{formData.phone}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-gray-700 pb-3">
                <span className="text-gray-400">Business</span>
                <span className="text-white font-medium">{formData.businessName}</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-3">
                <span className="text-gray-400">Scheduled</span>
                <span className="text-white font-medium">
                  {new Date(formData.preferredDateTime).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="pt-2">
                <span className="text-gray-400 block mb-2">Services</span>
                <div className="flex flex-wrap gap-2">
                  {formData.needs.map((need) => (
                    <span key={need} className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-full">
                      {needsOptions.find((o) => o.value === need)?.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={prevStep} disabled={isSubmitting} className="flex-1 py-4 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 transition disabled:opacity-50">
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-4 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Confirming...
                </>
              ) : (
                'Confirm Booking'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
