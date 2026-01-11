'use client';

/**
 * Email Command Center
 * GreenLine365 Admin V2
 * 
 * Features:
 * - Pre-built email templates
 * - Template customization
 * - Send emails to waitlist, customers, or custom lists
 * - Campaign management
 * - Email analytics
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: 'marketing' | 'transactional' | 'newsletter' | 'custom';
  subject: string;
  preview_text: string;
  html_content: string;
  variables: string[];
  is_default: boolean;
  created_at: string;
}

interface EmailCampaign {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  total_recipients: number;
  emails_sent: number;
  emails_opened: number;
  scheduled_for: string | null;
  sent_at: string | null;
  created_at: string;
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  marketing: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  transactional: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  newsletter: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  custom: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
};

export default function EmailCommandCenter() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [activeTab, setActiveTab] = useState<'templates' | 'campaigns' | 'compose'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Compose form state
  const [composeForm, setComposeForm] = useState({
    recipientType: 'waitlist' as 'waitlist' | 'custom',
    customEmails: '',
    subject: '',
    templateId: '',
    variables: {} as Record<string, string>,
  });

  // Fetch templates and campaigns
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [templatesRes, campaignsRes] = await Promise.all([
        fetch('/api/email/templates'),
        fetch('/api/email/campaigns'),
      ]);
      
      const templatesData = await templatesRes.json();
      const campaignsData = await campaignsRes.json();
      
      setTemplates(templatesData.templates || []);
      setCampaigns(campaignsData.campaigns || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setComposeForm(prev => ({
      ...prev,
      subject: template.subject,
      templateId: template.id,
      variables: template.variables.reduce((acc, v) => ({ ...acc, [v]: '' }), {}),
    }));
    setActiveTab('compose');
  };

  const handleSendEmail = async () => {
    if (!composeForm.subject || !composeForm.templateId) {
      setMessage({ type: 'error', text: 'Please select a template and enter a subject' });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      // Get recipients
      let recipients: string[] = [];
      
      if (composeForm.recipientType === 'waitlist') {
        // Fetch waitlist emails
        const waitlistRes = await fetch('/api/waitlist');
        const waitlistData = await waitlistRes.json();
        recipients = waitlistData.submissions?.map((s: any) => s.email) || [];
      } else {
        recipients = composeForm.customEmails.split(',').map(e => e.trim()).filter(Boolean);
      }

      if (recipients.length === 0) {
        setMessage({ type: 'error', text: 'No recipients found' });
        setSending(false);
        return;
      }

      // Send email
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipients,
          subject: composeForm.subject,
          template_id: composeForm.templateId,
          variables: composeForm.variables,
        }),
      });

      const result = await response.json();

      if (result.success || result.partial) {
        setMessage({ 
          type: 'success', 
          text: `Successfully sent ${result.sent} email(s)${result.failed > 0 ? `, ${result.failed} failed` : ''}` 
        });
        // Reset form
        setComposeForm({
          recipientType: 'waitlist',
          customEmails: '',
          subject: '',
          templateId: '',
          variables: {},
        });
        setSelectedTemplate(null);
        fetchData(); // Refresh campaigns
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to send emails' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to send emails' });
    }

    setSending(false);
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
                  <span className="text-2xl">📧</span>
                  Email Command Center
                </h1>
                <p className="text-sm text-white/50">Send marketing emails, newsletters, and transactional emails</p>
              </div>
            </div>
            
            <button
              onClick={() => setActiveTab('compose')}
              className="px-4 py-2 bg-[#39FF14] text-black font-semibold rounded-lg hover:bg-[#39FF14]/90 transition flex items-center gap-2"
              data-testid="compose-email-btn"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Compose Email
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex gap-2">
          {(['templates', 'campaigns', 'compose'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                activeTab === tab
                  ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'templates' && '📋 Templates'}
              {tab === 'campaigns' && '📊 Campaigns'}
              {tab === 'compose' && '✍️ Compose'}
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
            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#1A1A1A] rounded-xl border border-white/10 p-5 hover:border-[#39FF14]/30 transition group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[template.category]?.bg} ${categoryColors[template.category]?.text} border ${categoryColors[template.category]?.border}`}>
                        {template.category}
                      </span>
                      {template.is_default && (
                        <span className="text-xs text-white/40">Default</span>
                      )}
                    </div>
                    
                    <h3 className="text-white font-semibold mb-2">{template.name}</h3>
                    <p className="text-sm text-white/50 mb-4 line-clamp-2">{template.description || template.subject}</p>
                    
                    <div className="flex items-center gap-2 text-xs text-white/40 mb-4">
                      <span>Variables: {template.variables?.length || 0}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSelectTemplate(template)}
                        className="flex-1 px-3 py-2 bg-[#39FF14]/10 text-[#39FF14] rounded-lg text-sm font-medium hover:bg-[#39FF14]/20 transition"
                        data-testid={`use-template-${template.slug}`}
                      >
                        Use Template
                      </button>
                      <button className="px-3 py-2 bg-white/5 text-white/60 rounded-lg text-sm hover:bg-white/10 transition">
                        Preview
                      </button>
                    </div>
                  </motion.div>
                ))}
                
                {templates.length === 0 && (
                  <div className="col-span-full text-center py-20 text-white/50">
                    <p>No templates found. Run the email migration first.</p>
                  </div>
                )}
              </div>
            )}

            {/* Campaigns Tab */}
            {activeTab === 'campaigns' && (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#1A1A1A] rounded-xl border border-white/10 p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-semibold">{campaign.name}</h3>
                        <p className="text-sm text-white/50">
                          {campaign.total_recipients} recipients • 
                          {campaign.status === 'sent' ? ` Sent ${new Date(campaign.sent_at!).toLocaleDateString()}` : ` ${campaign.status}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#39FF14]">{campaign.emails_sent}</p>
                          <p className="text-xs text-white/40">Sent</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#0CE293]">
                            {campaign.emails_sent > 0 ? Math.round((campaign.emails_opened / campaign.emails_sent) * 100) : 0}%
                          </p>
                          <p className="text-xs text-white/40">Opened</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {campaigns.length === 0 && (
                  <div className="text-center py-20 text-white/50">
                    <p>No campaigns yet. Compose your first email!</p>
                  </div>
                )}
              </div>
            )}

            {/* Compose Tab */}
            {activeTab === 'compose' && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-6">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span>✍️</span>
                    Compose Email
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
                            setComposeForm(prev => ({ ...prev, templateId: '', variables: {} }));
                          }}
                          className="text-white/50 hover:text-white"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Recipients */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-white/80 mb-2">Recipients</label>
                    <div className="flex gap-4 mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="recipientType"
                          value="waitlist"
                          checked={composeForm.recipientType === 'waitlist'}
                          onChange={() => setComposeForm(prev => ({ ...prev, recipientType: 'waitlist' }))}
                          className="text-[#39FF14]"
                        />
                        <span className="text-white/80">Waitlist Subscribers</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="recipientType"
                          value="custom"
                          checked={composeForm.recipientType === 'custom'}
                          onChange={() => setComposeForm(prev => ({ ...prev, recipientType: 'custom' }))}
                          className="text-[#39FF14]"
                        />
                        <span className="text-white/80">Custom List</span>
                      </label>
                    </div>
                    
                    {composeForm.recipientType === 'custom' && (
                      <textarea
                        value={composeForm.customEmails}
                        onChange={(e) => setComposeForm(prev => ({ ...prev, customEmails: e.target.value }))}
                        placeholder="Enter email addresses, separated by commas"
                        className="w-full p-3 bg-[#0D0D0D] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-[#39FF14]/50 focus:outline-none"
                        rows={3}
                        data-testid="custom-emails-input"
                      />
                    )}
                  </div>
                  
                  {/* Subject */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-white/80 mb-2">Subject Line</label>
                    <input
                      type="text"
                      value={composeForm.subject}
                      onChange={(e) => setComposeForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Enter email subject"
                      className="w-full p-3 bg-[#0D0D0D] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-[#39FF14]/50 focus:outline-none"
                      data-testid="email-subject-input"
                    />
                  </div>
                  
                  {/* Template Variables */}
                  {selectedTemplate && selectedTemplate.variables?.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-white/80 mb-2">Template Variables</label>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedTemplate.variables.map((variable) => (
                          <div key={variable}>
                            <label className="block text-xs text-white/50 mb-1">{`{{${variable}}}`}</label>
                            <input
                              type="text"
                              value={composeForm.variables[variable] || ''}
                              onChange={(e) => setComposeForm(prev => ({
                                ...prev,
                                variables: { ...prev.variables, [variable]: e.target.value }
                              }))}
                              placeholder={`Enter ${variable}`}
                              className="w-full p-2 bg-[#0D0D0D] border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-[#39FF14]/50 focus:outline-none text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Select Template Button */}
                  {!selectedTemplate && (
                    <div className="mb-6">
                      <button
                        onClick={() => setActiveTab('templates')}
                        className="w-full p-4 border-2 border-dashed border-white/20 rounded-lg text-white/50 hover:border-[#39FF14]/30 hover:text-[#39FF14] transition"
                      >
                        Select a Template to Continue
                      </button>
                    </div>
                  )}
                  
                  {/* Send Button */}
                  <button
                    onClick={handleSendEmail}
                    disabled={sending || !selectedTemplate}
                    className="w-full py-4 bg-[#39FF14] text-black font-bold rounded-lg hover:bg-[#39FF14]/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    data-testid="send-email-btn"
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
                        Send Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
