'use client';

/**
 * Access Codes & Invites Page
 * Admin page for generating codes and sending invites
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Copy, Check, Trash2, Eye, EyeOff, Mail, Send } from 'lucide-react';

interface AccessCode {
  id: string;
  code: string;
  max_uses: number;
  current_uses: number;
  linked_tier: string;
  code_type: string;
  description: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AccessCodesPage() {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const response = await fetch('/api/admin/access-codes');
      const data = await response.json();
      setCodes(data.codes || []);
    } catch (error) {
      console.error('Failed to fetch codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const deleteCode = async (codeId: string) => {
    if (!confirm('Are you sure you want to delete this code?')) return;
    
    try {
      await fetch(`/api/admin/access-codes?id=${codeId}`, {
        method: 'DELETE'
      });
      fetchCodes();
    } catch (error) {
      console.error('Failed to delete code:', error);
    }
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      tier1: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      tier2: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      tier3: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    };
    const labels = {
      tier1: 'Starter ($299)',
      tier2: 'Professional ($599)',
      tier3: 'Enterprise ($999)',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${colors[tier as keyof typeof colors]}`}>
        {labels[tier as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Access Codes & Invites</h1>
            <p className="text-white/60 mt-2">Generate codes and send invites to new customers</p>
          </div>
          <button
            onClick={() => setShowSendModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#39FF14] to-[#0CE293] text-black font-semibold rounded-lg hover:opacity-90 transition shadow-lg"
          >
            <Send className="w-5 h-5" />
            Send Invite
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto mb-8 grid grid-cols-4 gap-4">
        <div className="p-6 bg-white/5 rounded-lg border border-white/10">
          <div className="text-3xl font-bold text-white mb-2">{codes.length}</div>
          <div className="text-sm text-white/60">Total Codes</div>
        </div>
        <div className="p-6 bg-white/5 rounded-lg border border-white/10">
          <div className="text-3xl font-bold text-green-400 mb-2">
            {codes.filter(c => c.is_active).length}
          </div>
          <div className="text-sm text-white/60">Active</div>
        </div>
        <div className="p-6 bg-white/5 rounded-lg border border-white/10">
          <div className="text-3xl font-bold text-blue-400 mb-2">
            {codes.reduce((sum, c) => sum + c.current_uses, 0)}
          </div>
          <div className="text-sm text-white/60">Redemptions</div>
        </div>
        <div className="p-6 bg-white/5 rounded-lg border border-white/10">
          <div className="text-3xl font-bold text-purple-400 mb-2">
            {codes.filter(c => c.code_type === 'family').length}
          </div>
          <div className="text-sm text-white/60">Family Codes</div>
        </div>
      </div>

      {/* Codes Table */}
      <div className="max-w-7xl mx-auto bg-white/5 rounded-lg border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-white/80">Code</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-white/80">Tier</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-white/80">Uses</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-white/80">Expires</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-white/80">Status</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-white/80">Actions</th>
            </tr>
          </thead>
          <tbody>
            {codes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-white/60">
                  No codes yet. Click "Send Invite" to create your first one!
                </td>
              </tr>
            ) : (
              codes.map((code) => (
                <tr key={code.id} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="text-[#39FF14] font-mono text-sm font-bold">{code.code}</code>
                      <button
                        onClick={() => copyCode(code.code)}
                        className="p-1 hover:bg-white/10 rounded transition"
                      >
                        {copiedCode === code.code ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-white/60" />
                        )}
                      </button>
                    </div>
                    {code.description && (
                      <div className="text-xs text-white/50 mt-1">{code.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {getTierBadge(code.linked_tier)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white">
                      {code.current_uses} / {code.max_uses}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white/60">
                      {code.expires_at 
                        ? new Date(code.expires_at).toLocaleDateString()
                        : 'Never'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {code.is_active ? (
                      <span className="flex items-center gap-1.5 text-green-400 text-sm">
                        <Eye className="w-4 h-4" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-400 text-sm">
                        <EyeOff className="w-4 h-4" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => deleteCode(code.id)}
                        className="p-2 hover:bg-red-500/20 rounded transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Send Invite Modal */}
      <AnimatePresence>
        {showSendModal && (
          <SendInviteModal
            onClose={() => setShowSendModal(false)}
            onSuccess={() => {
              setShowSendModal(false);
              fetchCodes();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Send Invite Modal Component
function SendInviteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    recipientEmail: '',
    tier: 'tier2' as 'tier1' | 'tier2' | 'tier3',
    codeType: 'family',
    maxUses: 1,
    expiresInHours: 72,
    customMessage: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sentCode, setSentCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSentCode(data.code.code);
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 3000);
      } else {
        alert(data.error || 'Failed to send invite');
      }
    } catch (error) {
      console.error('Failed to send invite:', error);
      alert('Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-lg overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#39FF14] to-[#0CE293] p-6">
          <h3 className="text-2xl font-bold text-black">Send Invite</h3>
          <p className="text-black/70 text-sm mt-1">Generate code and send email invitation</p>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Invite Sent!</h4>
            <p className="text-white/60 mb-4">Email delivered to {formData.recipientEmail}</p>
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="text-xs text-white/60 mb-2">Access Code</div>
              <code className="text-2xl font-mono text-[#39FF14] font-bold">{sentCode}</code>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Recipient Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.recipientEmail}
                onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                placeholder="friend@example.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:border-[#39FF14] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Tier</label>
                <select
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#39FF14] focus:outline-none"
                >
                  <option value="tier1">Starter ($299/mo)</option>
                  <option value="tier2">Professional ($599/mo)</option>
                  <option value="tier3">Enterprise ($999/mo)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Expires In</label>
                <select
                  value={formData.expiresInHours}
                  onChange={(e) => setFormData({ ...formData, expiresInHours: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-[#39FF14] focus:outline-none"
                >
                  <option value="24">24 hours</option>
                  <option value="72">72 hours</option>
                  <option value="168">7 days</option>
                  <option value="0">Never</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Personal Message (Optional)
              </label>
              <textarea
                value={formData.customMessage}
                onChange={(e) => setFormData({ ...formData, customMessage: e.target.value })}
                placeholder="Looking forward to having you join!"
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:border-[#39FF14] focus:outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 transition font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-lg bg-gradient-to-r from-[#39FF14] to-[#0CE293] text-black font-semibold hover:opacity-90 disabled:opacity-50 transition"
              >
                {loading ? 'Sending...' : 'Generate & Send'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
