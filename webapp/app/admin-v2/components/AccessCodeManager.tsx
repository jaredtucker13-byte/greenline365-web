'use client';

/**
 * Access Code Manager
 * Admin panel for generating and managing promo codes
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Copy, Check, Trash2, Edit2, Eye, EyeOff } from 'lucide-react';

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

export function AccessCodeManager() {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  const toggleCodeStatus = async (codeId: string, isActive: boolean) => {
    try {
      await fetch('/api/admin/access-codes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codeId,
          updates: { is_active: !isActive }
        })
      });
      fetchCodes();
    } catch (error) {
      console.error('Failed to toggle code:', error);
    }
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
      tier1: 'Starter',
      tier2: 'Professional',
      tier3: 'Enterprise',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${colors[tier as keyof typeof colors]}`}>
        {labels[tier as keyof typeof labels]}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      promo: 'bg-green-500/20 text-green-400',
      family: 'bg-pink-500/20 text-pink-400',
      partner: 'bg-cyan-500/20 text-cyan-400',
      beta: 'bg-orange-500/20 text-orange-400',
      lifetime: 'bg-red-500/20 text-red-400',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[type as keyof typeof colors]}`}>
        {type.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return <div className="p-6 text-white/60">Loading codes...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Access Codes</h2>
          <p className="text-sm text-white/60 mt-1">Manage promo codes and special access</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#39FF14] text-black font-medium rounded-lg hover:bg-[#32E012] transition"
        >
          <Plus className="w-4 h-4" />
          Generate Code
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="text-2xl font-bold text-white">{codes.length}</div>
          <div className="text-sm text-white/60">Total Codes</div>
        </div>
        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="text-2xl font-bold text-green-400">
            {codes.filter(c => c.is_active).length}
          </div>
          <div className="text-sm text-white/60">Active</div>
        </div>
        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="text-2xl font-bold text-blue-400">
            {codes.reduce((sum, c) => sum + c.current_uses, 0)}
          </div>
          <div className="text-sm text-white/60">Total Redemptions</div>
        </div>
        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="text-2xl font-bold text-purple-400">
            {codes.filter(c => c.code_type === 'family').length}
          </div>
          <div className="text-sm text-white/60">Family Codes</div>
        </div>
      </div>

      {/* Codes Table */}
      <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-white/80">Code</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-white/80">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-white/80">Tier</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-white/80">Uses</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-white/80">Expires</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-white/80">Status</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-white/80">Actions</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((code) => (
              <tr key={code.id} className="border-b border-white/5 hover:bg-white/5 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <code className="text-[#39FF14] font-mono text-sm">{code.code}</code>
                    <button
                      onClick={() => copyCode(code.code)}
                      className="p-1 hover:bg-white/10 rounded transition"
                    >
                      {copiedCode === code.code ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-white/60" />
                      )}
                    </button>
                  </div>
                  {code.description && (
                    <div className="text-xs text-white/50 mt-1">{code.description}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {getTypeBadge(code.code_type)}
                </td>
                <td className="px-4 py-3">
                  {getTierBadge(code.linked_tier)}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-white">
                    {code.current_uses} / {code.max_uses}
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-[#39FF14] h-1.5 rounded-full transition-all"
                      style={{ width: `${(code.current_uses / code.max_uses) * 100}%` }}
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-white/60">
                    {code.expires_at 
                      ? new Date(code.expires_at).toLocaleDateString()
                      : 'Never'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {code.is_active ? (
                    <span className="flex items-center gap-1.5 text-green-400 text-sm">
                      <Eye className="w-3.5 h-3.5" />
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-red-400 text-sm">
                      <EyeOff className="w-3.5 h-3.5" />
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => toggleCodeStatus(code.id, code.is_active)}
                      className="p-1.5 hover:bg-white/10 rounded transition"
                      title={code.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {code.is_active ? (
                        <EyeOff className="w-4 h-4 text-white/60" />
                      ) : (
                        <Eye className="w-4 h-4 text-white/60" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteCode(code.id)}
                      className="p-1.5 hover:bg-red-500/20 rounded transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateCodeModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchCodes();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Create Code Modal Component
function CreateCodeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    codeType: 'promo',
    linkedTier: 'tier1',
    maxUses: 1,
    expiresInDays: '',
    description: '',
    customCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/access-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          expiresInDays: formData.expiresInDays ? parseInt(formData.expiresInDays) : null,
          customCode: formData.customCode || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedCode(data.code.code);
        setTimeout(() => {
          onSuccess();
        }, 3000);
      } else {
        alert(data.error || 'Failed to create code');
      }
    } catch (error) {
      console.error('Failed to create code:', error);
      alert('Failed to create code');
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
        className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-lg p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4">Generate Access Code</h3>

        {generatedCode ? (
          <div className="text-center py-8">
            <div className="text-sm text-white/60 mb-2">Code Generated!</div>
            <div className="text-2xl font-mono text-[#39FF14] mb-4">{generatedCode}</div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedCode);
                alert('Code copied to clipboard!');
              }}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
            >
              Copy Code
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/80 mb-2">Code Type</label>
              <select
                value={formData.codeType}
                onChange={(e) => setFormData({ ...formData, codeType: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="promo">Promo</option>
                <option value="family">Family</option>
                <option value="partner">Partner</option>
                <option value="beta">Beta</option>
                <option value="lifetime">Lifetime</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-2">Tier</label>
              <select
                value={formData.linkedTier}
                onChange={(e) => setFormData({ ...formData, linkedTier: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              >
                <option value="tier1">Starter ($299)</option>
                <option value="tier2">Professional ($599)</option>
                <option value="tier3">Enterprise ($999)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-2">Max Uses</label>
              <input
                type="number"
                min="1"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-2">Expires In (days, leave empty for never)</label>
              <input
                type="number"
                min="1"
                value={formData.expiresInDays}
                onChange={(e) => setFormData({ ...formData, expiresInDays: e.target.value })}
                placeholder="Never expires"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30"
              />
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-2">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Mom's account, Black Friday 2024"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30"
              />
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-2">Custom Code (optional)</label>
              <input
                type="text"
                value={formData.customCode}
                onChange={(e) => setFormData({ ...formData, customCode: e.target.value.toUpperCase() })}
                placeholder="Auto-generated if empty"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 font-mono"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 rounded-lg bg-[#39FF14] text-black font-medium hover:bg-[#32E012] disabled:opacity-50 transition"
              >
                {loading ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default AccessCodeManager;
