'use client';

/**
 * SMS Command Center
 * GreenLine365 Admin V2
 * 
 * Features:
 * - Send SMS messages
 * - Pre-built SMS templates
 * - OTP verification
 * - Bulk SMS campaigns
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface SMSTemplate {
  id: string;
  name: string;
  slug: string;
  category: string;
  message: string;
  variables: string[];
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  marketing: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  transactional: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  custom: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
};

export default function SMSCommandCenter() {
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'send' | 'templates' | 'otp'>('send');
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Send SMS form
  const [smsForm, setSmsForm] = useState({
    to: '',
    message: '',
    variables: {} as Record<string, string>,
  });

  // OTP form
  const [otpForm, setOtpForm] = useState({
    phone: '',
    code: '',
    step: 1 as 1 | 2,
  });
  const [otpStatus, setOtpStatus] = useState<string>('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sms/templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
    setLoading(false);
  };

  const handleSelectTemplate = (template: SMSTemplate) => {
    setSelectedTemplate(template);
    setSmsForm(prev => ({
      ...prev,
      message: template.message,
      variables: template.variables.reduce((acc, v) => ({ ...acc, [v]: '' }), {}),
    }));
  };

  const handleSendSMS = async () => {
    if (!smsForm.to || !smsForm.message) {
      setMessage({ type: 'error', text: 'Please enter phone number and message' });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: smsForm.to.split(',').map(n => n.trim()),
          message: smsForm.message,
          variables: smsForm.variables,
        }),
      });

      const result = await response.json();

      if (result.success || result.partial) {
        setMessage({
          type: 'success',
          text: `Successfully sent ${result.sent} SMS${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
        });
        setSmsForm({ to: '', message: '', variables: {} });
        setSelectedTemplate(null);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to send SMS' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to send SMS' });
    }

    setSending(false);
  };

  const handleSendOTP = async () => {
    if (!otpForm.phone) {
      setMessage({ type: 'error', text: 'Please enter phone number' });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const response = await fetch('/api/sms/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpForm.phone }),
      });

      const result = await response.json();

      if (result.success) {
        setOtpForm(prev => ({ ...prev, step: 2 }));
        setOtpStatus('OTP sent! Check your phone.');
        setMessage({ type: 'success', text: 'OTP sent successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to send OTP' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to send OTP' });
    }

    setSending(false);
  };

  const handleVerifyOTP = async () => {
    if (!otpForm.code) {
      setMessage({ type: 'error', text: 'Please enter the verification code' });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const response = await fetch('/api/sms/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpForm.phone, code: otpForm.code }),
      });

      const result = await response.json();

      if (result.valid) {
        setMessage({ type: 'success', text: 'Phone number verified successfully!' });
        setOtpForm({ phone: '', code: '', step: 1 });
        setOtpStatus('');
      } else {
        setMessage({ type: 'error', text: 'Invalid verification code. Please try again.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Verification failed' });
    }

    setSending(false);
  };

  // Replace variables in message preview
  const getMessagePreview = () => {
    let preview = smsForm.message;
    for (const [key, value] of Object.entries(smsForm.variables)) {
      if (value) {
        preview = preview.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
    }
    return preview;
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0D0D0D]/95 backdrop-blur border-b border-[#39FF14]/10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin-v2"
                className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">📱</span>
                  SMS Command Center
                </h1>
                <p className="text-sm text-white/50">Send SMS, OTP verification, and marketing messages</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex gap-2">
          {(['send', 'templates', 'otp'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                activeTab === tab
                  ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'send' && '📤 Send SMS'}
              {tab === 'templates' && '📋 Templates'}
              {tab === 'otp' && '🔐 OTP Verify'}
            </button>
          ))}
        </div>
      </div>

      {/* Message Banner */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mx-6 mt-4 p-4 rounded-lg flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="p-1 hover:bg-white/10 rounded">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <main className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-[#39FF14] border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Send SMS Tab */}
            {activeTab === 'send' && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-6">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span>📤</span>
                    Send SMS Message
                  </h2>

                  {/* Selected Template */}
                  {selectedTemplate && (
                    <div className="mb-6 p-4 bg-[#39FF14]/5 border border-[#39FF14]/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-[#39FF14]">Using Template</p>
                          <p className="text-white font-medium">{selectedTemplate.name}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedTemplate(null);
                            setSmsForm(prev => ({ ...prev, message: '', variables: {} }));
                          }}
                          className="text-white/50 hover:text-white"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Phone Number(s) */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Phone Number(s)
                    </label>
                    <input
                      type="text"
                      value={smsForm.to}
                      onChange={(e) => setSmsForm(prev => ({ ...prev, to: e.target.value }))}
                      placeholder="+1234567890 (separate multiple with commas)"
                      className="w-full p-3 bg-[#0D0D0D] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-[#39FF14]/50 focus:outline-none"
                      data-testid="sms-to-input"
                    />
                    <p className="text-xs text-white/40 mt-1">Use E.164 format (+1 for US numbers)</p>
                  </div>

                  {/* Message */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Message
                    </label>
                    <textarea
                      value={smsForm.message}
                      onChange={(e) => setSmsForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Enter your message..."
                      rows={4}
                      className="w-full p-3 bg-[#0D0D0D] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-[#39FF14]/50 focus:outline-none"
                      data-testid="sms-message-input"
                    />
                    <p className="text-xs text-white/40 mt-1">
                      {smsForm.message.length}/160 characters (1 SMS segment)
                    </p>
                  </div>

                  {/* Template Variables */}
                  {selectedTemplate && selectedTemplate.variables.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Template Variables
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedTemplate.variables.map((variable) => (
                          <div key={variable}>
                            <label className="block text-xs text-white/50 mb-1">{`{{${variable}}}`}</label>
                            <input
                              type="text"
                              value={smsForm.variables[variable] || ''}
                              onChange={(e) =>
                                setSmsForm(prev => ({
                                  ...prev,
                                  variables: { ...prev.variables, [variable]: e.target.value },
                                }))
                              }
                              placeholder={`Enter ${variable}`}
                              className="w-full p-2 bg-[#0D0D0D] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-[#39FF14]/50 focus:outline-none text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message Preview */}
                  {smsForm.message && (
                    <div className="mb-6 p-4 bg-[#0D0D0D] border border-white/10 rounded-lg">
                      <p className="text-xs text-white/50 mb-2">Preview:</p>
                      <p className="text-white">{getMessagePreview()}</p>
                    </div>
                  )}

                  {/* Quick Template Selection */}
                  {!selectedTemplate && (
                    <div className="mb-6">
                      <p className="text-sm text-white/60 mb-3">Or select a template:</p>
                      <div className="flex flex-wrap gap-2">
                        {templates.slice(0, 4).map((template) => (
                          <button
                            key={template.id}
                            onClick={() => handleSelectTemplate(template)}
                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition"
                          >
                            {template.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Send Button */}
                  <button
                    onClick={handleSendSMS}
                    disabled={sending || !smsForm.to || !smsForm.message}
                    className="w-full py-4 bg-[#39FF14] text-black font-bold rounded-lg hover:bg-[#39FF14]/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    data-testid="send-sms-btn"
                  >
                    {sending ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send SMS
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#1A1A1A] rounded-xl border border-white/10 p-5 hover:border-[#39FF14]/30 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${categoryColors[template.category]?.bg} ${categoryColors[template.category]?.text} border ${categoryColors[template.category]?.border}`}
                      >
                        {template.category}
                      </span>
                    </div>

                    <h3 className="text-white font-semibold mb-2">{template.name}</h3>
                    <p className="text-sm text-white/50 mb-4 line-clamp-3">{template.message}</p>

                    <div className="flex items-center gap-2 text-xs text-white/40 mb-4">
                      <span>Variables: {template.variables?.length || 0}</span>
                    </div>

                    <button
                      onClick={() => {
                        handleSelectTemplate(template);
                        setActiveTab('send');
                      }}
                      className="w-full px-3 py-2 bg-[#39FF14]/10 text-[#39FF14] rounded-lg text-sm font-medium hover:bg-[#39FF14]/20 transition"
                    >
                      Use Template
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* OTP Tab */}
            {activeTab === 'otp' && (
              <div className="max-w-md mx-auto">
                <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-6">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span>🔐</span>
                    Phone Verification
                  </h2>

                  {otpForm.step === 1 ? (
                    <>
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={otpForm.phone}
                          onChange={(e) => setOtpForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+1234567890"
                          className="w-full p-3 bg-[#0D0D0D] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-[#39FF14]/50 focus:outline-none"
                          data-testid="otp-phone-input"
                        />
                      </div>

                      <button
                        onClick={handleSendOTP}
                        disabled={sending || !otpForm.phone}
                        className="w-full py-3 bg-[#39FF14] text-black font-bold rounded-lg hover:bg-[#39FF14]/90 transition disabled:opacity-50"
                        data-testid="send-otp-btn"
                      >
                        {sending ? 'Sending...' : 'Send Verification Code'}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-sm">
                        {otpStatus}
                      </div>

                      <div className="mb-6">
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Verification Code
                        </label>
                        <input
                          type="text"
                          value={otpForm.code}
                          onChange={(e) => setOtpForm(prev => ({ ...prev, code: e.target.value }))}
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                          className="w-full p-3 bg-[#0D0D0D] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-[#39FF14]/50 focus:outline-none text-center text-2xl tracking-widest"
                          data-testid="otp-code-input"
                        />
                      </div>

                      <button
                        onClick={handleVerifyOTP}
                        disabled={sending || !otpForm.code}
                        className="w-full py-3 bg-[#39FF14] text-black font-bold rounded-lg hover:bg-[#39FF14]/90 transition disabled:opacity-50 mb-3"
                        data-testid="verify-otp-btn"
                      >
                        {sending ? 'Verifying...' : 'Verify Code'}
                      </button>

                      <button
                        onClick={() => setOtpForm(prev => ({ ...prev, step: 1, code: '' }))}
                        className="w-full py-2 text-white/60 hover:text-white transition text-sm"
                      >
                        ← Change phone number
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
