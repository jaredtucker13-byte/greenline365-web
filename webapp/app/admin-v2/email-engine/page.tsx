'use client';

/**
 * Unified Email Agentic Engine (UEAE)
 *
 * AI-powered Command Center for composing, enriching, and sending
 * emails through a 6-phase pipeline with content aggregation sidebar.
 *
 * Modes: Manual Command (HITL) | Auto-Send Pipeline
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import type {
  PipelineMode,
  PhaseStatus,
  TenantOption,
  TenantContext,
  ContextItem,
  ResearchFindings,
  VisionReport,
  GenerateResponse,
  GeneratedImage,
  ContentBlockToggles,
  ContentSnippet,
  BlogContent,
  StashItem,
  AutoRule,
  ExecutionLogEntry,
  Toast,
} from './lib/types';
import { markdownToEmailHtml } from './lib/email-html-renderer';

// ============ HELPERS ============

let toastCounter = 0;

function PhaseCard({
  phase,
  title,
  icon,
  status,
  collapsed,
  onToggle,
  children,
}: {
  phase: number;
  title: string;
  icon: string;
  status: PhaseStatus;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const statusColors: Record<PhaseStatus, string> = {
    idle: 'bg-[#333] text-white/40',
    loading: 'bg-[#C9A96E]/20 text-[#C9A96E] animate-pulse',
    complete: 'bg-green-500/20 text-green-400',
    error: 'bg-red-500/20 text-red-400',
  };
  const statusLabels: Record<PhaseStatus, string> = {
    idle: 'Idle',
    loading: 'Processing...',
    complete: 'Complete',
    error: 'Error',
  };

  return (
    <div className="border border-[#2a2a2a] rounded-xl bg-[#1a1a1a] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition"
        data-testid={`phase-${phase}-header`}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg w-7 text-center">{icon}</span>
          <span className="font-semibold text-white text-sm">Phase {phase}: {title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
          <svg className={`w-4 h-4 text-white/30 transition-transform ${collapsed ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {!collapsed && (
        <div className="px-5 pb-5 pt-1 border-t border-[#2a2a2a]">
          {status === 'loading' ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-white/5 rounded w-3/4" />
              <div className="h-4 bg-white/5 rounded w-1/2" />
              <div className="h-4 bg-white/5 rounded w-5/6" />
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}

function GoldButton({
  onClick,
  disabled,
  loading,
  children,
  className = '',
  testId,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{
        background: disabled || loading ? '#333' : 'linear-gradient(135deg, #C9A96E 0%, #8A6A1C 100%)',
        color: disabled || loading ? '#888' : '#fff',
      }}
      data-testid={testId}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

function EditableBlock({
  item,
  onUpdate,
  onDelete,
}: {
  item: ContextItem;
  onUpdate: (id: string, value: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(item.value);

  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-white/[0.03] border border-[#2a2a2a] group">
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-[#C9A96E] font-medium uppercase tracking-wide mb-1">{item.label}</p>
        {editing && item.editable ? (
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            onBlur={() => { setEditing(false); onUpdate(item.id, value); }}
            className="w-full bg-transparent text-white/80 text-sm border-b border-[#C9A96E]/30 focus:outline-none resize-none"
            rows={2}
            autoFocus
          />
        ) : (
          <p className="text-sm text-white/70 whitespace-pre-wrap break-words">{item.value || '—'}</p>
        )}
      </div>
      {item.editable && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
          <button onClick={() => setEditing(!editing)} className="p-1 text-white/30 hover:text-[#C9A96E]" title="Edit">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
          <button onClick={() => onDelete(item.id)} className="p-1 text-white/30 hover:text-red-400" title="Delete">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}

// ============ MAIN COMPONENT ============

export default function EmailEnginePage() {
  // -- Pipeline state --
  const [mode, setMode] = useState<PipelineMode>('manual');
  const [collapsedPhases, setCollapsedPhases] = useState<Record<number, boolean>>({ 1: false, 2: true, 3: true, 4: true, 5: true, 6: true });
  const [phaseStatus, setPhaseStatus] = useState<Record<number, PhaseStatus>>({ 1: 'idle', 2: 'idle', 3: 'idle', 4: 'idle', 5: 'idle', 6: 'idle' });

  // -- Phase 1: Context --
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [tenantContext, setTenantContext] = useState<TenantContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -- Phase 2: Intelligence --
  const [researchFindings, setResearchFindings] = useState<ResearchFindings | null>(null);
  const [visionReport, setVisionReport] = useState<VisionReport | null>(null);
  const [activeModel, setActiveModel] = useState('');

  // -- Phase 3: Writer's Room --
  const [draftResponse, setDraftResponse] = useState<GenerateResponse | null>(null);
  const [editedDraft, setEditedDraft] = useState('');
  const [subjectLine, setSubjectLine] = useState('');
  const draftEditorRef = useRef<HTMLDivElement>(null);

  // -- Phase 4: Visual Studio --
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // -- Phase 5: Preview --
  const [contentToggles, setContentToggles] = useState<ContentBlockToggles>({
    aiBody: true,
    visionAddendum: false,
    generatedImage: false,
    qrCode: false,
  });

  // -- Phase 6: Send --
  const [trackEngagement, setTrackEngagement] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState<'campaign' | 'newsletter' | 'report' | 'announcement' | 'personal'>('campaign');

  // -- Sidebar: Content Aggregator --
  const [slackInput, setSlackInput] = useState('');
  const [blogUrl, setBlogUrl] = useState('');
  const [blogContent, setBlogContent] = useState<BlogContent | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [contentSnippets, setContentSnippets] = useState<ContentSnippet[]>([]);
  const [stash, setStash] = useState<StashItem[]>([]);
  const [stashInput, setStashInput] = useState('');

  // -- Auto-Send Pipeline --
  const [autoRules, setAutoRules] = useState<AutoRule[]>([]);
  const [executionLog, setExecutionLog] = useState<ExecutionLogEntry[]>([]);
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', trigger: '', templateId: '', schedule: '', humanWaitGate: false });

  // -- Toast --
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = String(++toastCounter);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const setPhase = useCallback((phase: number, status: PhaseStatus) => {
    setPhaseStatus(prev => ({ ...prev, [phase]: status }));
  }, []);

  const expandPhase = useCallback((phase: number) => {
    setCollapsedPhases(prev => ({ ...prev, [phase]: false }));
  }, []);

  // ============ LOAD TENANTS ============

  useEffect(() => {
    fetch('/api/email-engine/context', { method: 'OPTIONS' }).catch(() => {});
    // Fetch CRM contacts for tenant dropdown
    fetch('/api/crm?limit=200')
      .then(r => r.ok ? r.json() : { data: [] })
      .then(res => {
        const leads = res.data || res.leads || res || [];
        if (Array.isArray(leads)) {
          setTenants(leads.map((l: any) => ({
            id: l.id,
            name: l.name || l.business_name || l.email || 'Unknown',
            email: l.email || '',
            phone: l.phone || '',
            company: l.company || l.business_name || '',
          })));
        }
      })
      .catch(() => {});
  }, []);

  // Load auto-rules when on auto tab
  useEffect(() => {
    if (mode === 'auto') {
      fetch('/api/email-engine/auto-rules')
        .then(r => r.ok ? r.json() : [])
        .then(data => { if (Array.isArray(data)) setAutoRules(data); })
        .catch(() => {});
    }
  }, [mode]);

  // ============ PHASE 1: CONTEXT FETCHER ============

  const handleRetrieveContext = async () => {
    if (!selectedTenant) { addToast('error', 'Select a tenant first'); return; }
    setPhase(1, 'loading');
    try {
      const res = await fetch('/api/email-engine/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: selectedTenant, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch context');
      setTenantContext(data);
      setPhase(1, 'complete');
      expandPhase(2);
      addToast('success', `Context loaded for ${data.name}`);
    } catch (err: any) {
      setPhase(1, 'error');
      addToast('error', err.message);
    }
  };

  const handleUpdateContextItem = (id: string, value: string) => {
    if (!tenantContext) return;
    setTenantContext({
      ...tenantContext,
      items: tenantContext.items.map(i => i.id === id ? { ...i, value } : i),
    });
  };

  const handleDeleteContextItem = (id: string) => {
    if (!tenantContext) return;
    setTenantContext({
      ...tenantContext,
      items: tenantContext.items.filter(i => i.id !== id),
    });
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (uploadedImages.length + files.length > 10) {
      addToast('error', 'Maximum 10 images allowed');
      return;
    }
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (uploadedImages.length + files.length > 10) {
      addToast('error', 'Maximum 10 images allowed');
      return;
    }
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  // ============ PHASE 2: INTELLIGENCE ============

  const handleAnalyze = async () => {
    setPhase(2, 'loading');
    try {
      // Run research and vision in parallel
      const promises: Promise<void>[] = [];

      // Research
      setActiveModel('perplexity/sonar-pro');
      promises.push(
        fetch('/api/email-engine/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: description || `Email for ${tenantContext?.name || 'tenant'}`,
            tenantContext,
          }),
        })
          .then(r => r.json())
          .then(data => {
            if (data.error) throw new Error(data.error);
            setResearchFindings(data);
            setActiveModel(data.model);
          })
      );

      // Vision (only if images uploaded)
      if (uploadedImages.length > 0) {
        promises.push(
          fetch('/api/email-engine/vision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrls: uploadedImages, context: description }),
          })
            .then(r => r.json())
            .then(data => {
              if (data.error) throw new Error(data.error);
              setVisionReport(data);
              setContentToggles(prev => ({ ...prev, visionAddendum: true }));
            })
        );
      }

      await Promise.all(promises);
      setPhase(2, 'complete');
      expandPhase(3);
      addToast('success', 'Analysis complete');
    } catch (err: any) {
      setPhase(2, 'error');
      addToast('error', err.message);
    } finally {
      setActiveModel('');
    }
  };

  // ============ PHASE 3: WRITER'S ROOM ============

  const handleGenerateDraft = async () => {
    setPhase(3, 'loading');
    try {
      const res = await fetch('/api/email-engine/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: tenantContext,
          research: researchFindings,
          visionReport,
          description,
          contentSnippets,
          blogContent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate draft');
      setDraftResponse(data);
      setEditedDraft(data.enhancedDraft);
      setSubjectLine(data.subjectLine);
      setPhase(3, 'complete');
      expandPhase(4);
      // Auto-generate image prompt from email content
      setImagePrompt(`Professional image for an email about: ${data.subjectLine}. ${description.slice(0, 100)}`);
      addToast('success', 'Draft generated');
    } catch (err: any) {
      setPhase(3, 'error');
      addToast('error', err.message);
    }
  };

  // ============ PHASE 4: VISUAL STUDIO ============

  const handleGenerateImage = async () => {
    if (!imagePrompt) { addToast('error', 'Enter an image prompt'); return; }
    setImageLoading(true);
    try {
      const res = await fetch('/api/generate-nano-banana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate image');
      setGeneratedImage({
        url: data.url || data.imageUrl || data.image_url || '',
        prompt: imagePrompt,
        timestamp: new Date().toISOString(),
      });
      setContentToggles(prev => ({ ...prev, generatedImage: true }));
      setPhase(4, 'complete');
      expandPhase(5);
      addToast('success', 'Image generated');
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setImageLoading(false);
    }
  };

  // ============ PHASE 5: PREVIEW helpers ============

  const assembledPreviewHtml = (() => {
    const parts: string[] = [];
    if (contentToggles.aiBody && editedDraft) {
      // Use the markdown-to-HTML renderer for proper formatting
      parts.push(markdownToEmailHtml(editedDraft));
    }
    if (contentToggles.visionAddendum && visionReport) {
      parts.push(`<div style="border-top:1px solid #333;padding-top:12px;margin-top:12px;"><p style="color:#C9A96E;font-size:12px;font-weight:600;margin:0 0 6px;">VISUAL REPORT</p><p style="color:#a0a0a0;font-size:13px;line-height:1.6;margin:0;">${visionReport.analysis}</p></div>`);
    }
    if (contentToggles.generatedImage && generatedImage?.url) {
      parts.push(`<div style="text-align:center;margin:16px 0;"><img src="${generatedImage.url}" alt="Generated" style="max-width:100%;border-radius:8px;" /></div>`);
    }
    if (contentToggles.qrCode && qrCodeUrl) {
      parts.push(`<div style="text-align:center;margin:16px 0;"><img src="${qrCodeUrl}" alt="QR Code" style="width:120px;height:120px;" /></div>`);
    }
    return parts.join('\n');
  })();

  // ============ PHASE 6: SEND ============

  const handleSendEmail = async () => {
    setShowConfirmModal(false);
    if (!tenantContext?.email || !subjectLine || !editedDraft) {
      addToast('error', 'Missing recipient, subject, or body');
      return;
    }
    setPhase(6, 'loading');
    try {
      const res = await fetch('/api/email-engine/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: tenantContext.email,
          subject: subjectLine,
          htmlBody: editedDraft,
          images: generatedImage?.url ? [generatedImage.url] : [],
          qrCode: contentToggles.qrCode ? qrCodeUrl : null,
          trackEngagement,
          template: emailTemplate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      setPhase(6, 'complete');
      addToast('success', `Email sent to ${tenantContext.email}`);
    } catch (err: any) {
      setPhase(6, 'error');
      addToast('error', err.message);
    }
  };

  // ============ SIDEBAR: CONTENT AGGREGATOR ============

  const handleConvertSlack = () => {
    if (!slackInput.trim()) return;
    const snippet: ContentSnippet = {
      id: String(Date.now()),
      content: slackInput.trim(),
      source: 'slack',
      createdAt: new Date().toISOString(),
    };
    setContentSnippets(prev => [...prev, snippet]);
    setSlackInput('');
    addToast('info', 'Slack snippet added');
  };

  const handleBlogAction = async (action: 'link' | 'qr' | 'summary') => {
    if (!blogUrl.trim()) { addToast('error', 'Enter a blog URL'); return; }
    if (action === 'link') {
      const snippet: ContentSnippet = {
        id: String(Date.now()),
        content: `Read more: ${blogUrl}`,
        source: 'blog',
        createdAt: new Date().toISOString(),
      };
      setContentSnippets(prev => [...prev, snippet]);
      setBlogContent({ url: blogUrl });
      addToast('info', 'Blog link added');
    } else if (action === 'qr') {
      try {
        const res = await fetch('/api/qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: blogUrl }),
        });
        const data = await res.json();
        if (data.url || data.qrCode || data.image) {
          setQrCodeUrl(data.url || data.qrCode || data.image);
          setContentToggles(prev => ({ ...prev, qrCode: true }));
          addToast('success', 'QR code generated');
        }
      } catch { addToast('error', 'QR generation failed'); }
    } else if (action === 'summary') {
      const snippet: ContentSnippet = {
        id: String(Date.now()),
        content: `Blog micro-summary for: ${blogUrl}`,
        source: 'blog',
        createdAt: new Date().toISOString(),
      };
      setContentSnippets(prev => [...prev, snippet]);
      setBlogContent({ url: blogUrl, summary: 'Summary pending AI generation...' });
      addToast('info', 'Summary snippet added — will be enriched during generation');
    }
  };

  const handleGenerateQR = async () => {
    const url = blogUrl || tenantContext?.email ? `mailto:${tenantContext?.email}` : '';
    if (!url) { addToast('error', 'No URL to encode'); return; }
    try {
      const res = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.url || data.qrCode || data.image) {
        setQrCodeUrl(data.url || data.qrCode || data.image);
        setContentToggles(prev => ({ ...prev, qrCode: true }));
        addToast('success', 'QR code generated');
      }
    } catch { addToast('error', 'QR generation failed'); }
  };

  const handleSaveToStash = () => {
    if (!stashInput.trim()) return;
    setStash(prev => [...prev, { id: String(Date.now()), content: stashInput.trim(), label: `Stash ${prev.length + 1}`, createdAt: new Date().toISOString() }]);
    setStashInput('');
    addToast('info', 'Saved to stash');
  };

  const handleInjectStash = (item: StashItem) => {
    setContentSnippets(prev => [...prev, { id: String(Date.now()), content: item.content, source: 'stash', createdAt: new Date().toISOString() }]);
    addToast('info', 'Injected from stash');
  };

  // ============ AUTO RULES ============

  const handleCreateRule = async () => {
    if (!newRule.name || !newRule.trigger) { addToast('error', 'Name and trigger required'); return; }
    try {
      const res = await fetch('/api/email-engine/auto-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAutoRules(prev => [data, ...prev]);
      setNewRule({ name: '', trigger: '', templateId: '', schedule: '', humanWaitGate: false });
      setShowRuleBuilder(false);
      addToast('success', 'Rule created');
    } catch (err: any) { addToast('error', err.message); }
  };

  const handleToggleRule = async (rule: AutoRule) => {
    const newStatus = rule.status === 'active' ? 'paused' : 'active';
    try {
      await fetch('/api/email-engine/auto-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rule.id, status: newStatus }),
      });
      setAutoRules(prev => prev.map(r => r.id === rule.id ? { ...r, status: newStatus } : r));
    } catch { addToast('error', 'Failed to update rule'); }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await fetch('/api/email-engine/auto-rules', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setAutoRules(prev => prev.filter(r => r.id !== id));
      addToast('success', 'Rule deleted');
    } catch { addToast('error', 'Failed to delete rule'); }
  };

  const handleToggleHumanGate = async (rule: AutoRule) => {
    try {
      await fetch('/api/email-engine/auto-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rule.id, humanWaitGate: !rule.humanWaitGate }),
      });
      setAutoRules(prev =>
        prev.map(r => r.id === rule.id ? { ...r, humanWaitGate: !r.humanWaitGate } : r)
      );
    } catch { addToast('error', 'Failed to update gate'); }
  };

  // ============ RENDER ============

  return (
    <div className="min-h-screen bg-[#121212]" data-testid="email-engine-page">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-2.5 rounded-lg border text-sm font-medium shadow-lg animate-in slide-in-from-right ${
            t.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
            t.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
            'bg-blue-500/10 border-blue-500/30 text-blue-400'
          }`}>
            {t.message}
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-[#C9A96E]/30 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#C9A96E]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#C9A96E]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-white">Ready to Send</h3>
            </div>
            <div className="bg-[#111] rounded-xl p-4 space-y-3 mb-5 border border-[#2a2a2a]">
              <div className="flex justify-between items-start">
                <span className="text-xs text-white/40 uppercase tracking-wider">To</span>
                <span className="text-sm text-[#C9A96E] font-medium">{tenantContext?.email}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-xs text-white/40 uppercase tracking-wider">Subject</span>
                <span className="text-sm text-white/80 text-right max-w-[260px]">{subjectLine}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/40 uppercase tracking-wider">Template</span>
                <span className="text-xs text-white/60 bg-[#222] px-2 py-1 rounded capitalize">{emailTemplate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/40 uppercase tracking-wider">Tracking</span>
                <span className={`text-xs px-2 py-1 rounded ${trackEngagement ? 'text-green-400 bg-green-500/10' : 'text-white/40 bg-[#222]'}`}>{trackEngagement ? 'Enabled' : 'Disabled'}</span>
              </div>
              {(contentToggles.generatedImage || contentToggles.qrCode) && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/40 uppercase tracking-wider">Attachments</span>
                  <span className="text-xs text-white/60">
                    {[contentToggles.generatedImage && 'Image', contentToggles.qrCode && 'QR Code'].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-white/60 hover:text-white text-sm transition">
                Cancel
              </button>
              <GoldButton onClick={handleSendEmail} testId="confirm-send-btn">
                Send Now
              </GoldButton>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur border-b border-[#2a2a2a]">
        <div className="max-w-[1600px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin-v2" className="text-white/40 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#C9A96E]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>
                  Email Engine
                </h1>
                <p className="text-xs text-white/30">Unified Email Agentic Engine (UEAE)</p>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center gap-4">
              <div className="flex rounded-lg border border-[#2a2a2a] overflow-hidden">
                <button
                  onClick={() => setMode('manual')}
                  className={`px-4 py-1.5 text-sm font-medium transition ${mode === 'manual' ? 'bg-[#C9A96E] text-black' : 'text-white/50 hover:text-white'}`}
                  data-testid="mode-manual"
                >
                  Manual Command
                </button>
                <button
                  onClick={() => setMode('auto')}
                  className={`px-4 py-1.5 text-sm font-medium transition ${mode === 'auto' ? 'bg-[#C9A96E] text-black' : 'text-white/50 hover:text-white'}`}
                  data-testid="mode-auto"
                >
                  Auto-Send Pipeline
                </button>
              </div>

              {/* Pipeline Status Badges */}
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5, 6].map(p => (
                  <div
                    key={p}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      phaseStatus[p] === 'complete' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      phaseStatus[p] === 'loading' ? 'bg-[#C9A96E]/20 text-[#C9A96E] border border-[#C9A96E]/30 animate-pulse' :
                      phaseStatus[p] === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-[#1a1a1a] text-white/30 border border-[#2a2a2a]'
                    }`}
                    title={`Phase ${p}`}
                  >
                    {p}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {mode === 'manual' ? (
          /* ============ MANUAL COMMAND MODE ============ */
          <div className="flex gap-6">
            {/* Left Column: Pipeline (70%) */}
            <div className="w-[70%] space-y-4">

              {/* Phase 1: Context Fetcher */}
              <PhaseCard phase={1} title="Context Fetcher" icon="&#128269;" status={phaseStatus[1]} collapsed={collapsedPhases[1]} onToggle={() => setCollapsedPhases(p => ({ ...p, 1: !p[1] }))}>
                <div className="space-y-4">
                  {/* Tenant Dropdown */}
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Tenant / Contact</label>
                    <select
                      value={selectedTenant}
                      onChange={e => setSelectedTenant(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-[#121212] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-[#C9A96E]/50"
                      data-testid="tenant-select"
                    >
                      <option value="">Select a tenant...</option>
                      {tenants.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                      ))}
                    </select>
                  </div>

                  {/* Image Upload Zone */}
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Images (0-10)</label>
                    <div
                      onDrop={handleImageDrop}
                      onDragOver={e => e.preventDefault()}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#2a2a2a] rounded-xl p-4 text-center cursor-pointer hover:border-[#C9A96E]/30 transition"
                      data-testid="image-dropzone"
                    >
                      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                      <p className="text-white/30 text-sm">Drag & drop images or click to browse</p>
                      <p className="text-white/20 text-xs mt-1">{uploadedImages.length}/10 uploaded</p>
                    </div>
                    {uploadedImages.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {uploadedImages.map((img, i) => (
                          <div key={i} className="relative group">
                            <img src={img} alt={`Upload ${i + 1}`} className="w-16 h-16 rounded-lg object-cover border border-[#2a2a2a]" />
                            <button
                              onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                            >x</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Rough Description</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Describe the purpose of this email..."
                      className="w-full px-3 py-2.5 rounded-lg bg-[#121212] border border-[#2a2a2a] text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#C9A96E]/50 resize-y"
                      data-testid="description-input"
                    />
                  </div>

                  <GoldButton onClick={handleRetrieveContext} loading={phaseStatus[1] === 'loading'} testId="retrieve-context-btn">
                    Retrieve &amp; Sync
                  </GoldButton>

                  {/* Context Display */}
                  {tenantContext && (
                    <div className="space-y-2 mt-4">
                      <p className="text-xs font-medium text-white/40 uppercase tracking-wide">Fetched Context</p>
                      {tenantContext.items.map(item => (
                        <EditableBlock key={item.id} item={item} onUpdate={handleUpdateContextItem} onDelete={handleDeleteContextItem} />
                      ))}
                    </div>
                  )}
                </div>
              </PhaseCard>

              {/* Phase 2: Intelligence Layer */}
              <PhaseCard phase={2} title="Intelligence Layer" icon="&#129504;" status={phaseStatus[2]} collapsed={collapsedPhases[2]} onToggle={() => setCollapsedPhases(p => ({ ...p, 2: !p[2] }))}>
                <div className="space-y-4">
                  {activeModel && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#C9A96E]/5 border border-[#C9A96E]/20">
                      <div className="w-2 h-2 rounded-full bg-[#C9A96E] animate-pulse" />
                      <span className="text-xs text-[#C9A96E]">Active: {activeModel}</span>
                    </div>
                  )}

                  <GoldButton onClick={handleAnalyze} disabled={!tenantContext} loading={phaseStatus[2] === 'loading'} testId="analyze-btn">
                    Analyze &amp; Research
                  </GoldButton>

                  {researchFindings && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-white/40 uppercase tracking-wide">
                        Research Findings <span className="text-[#C9A96E]">({researchFindings.model}{researchFindings.wasFallback ? ' — fallback' : ''})</span>
                      </p>
                      <div className="p-3 rounded-lg bg-white/[0.03] border border-[#2a2a2a]">
                        <p className="text-sm text-white/70 mb-2">{researchFindings.summary}</p>
                        {researchFindings.keyPoints.map((point, i) => (
                          <p key={i} className="text-xs text-white/50 ml-3 mb-1">&#8226; {point}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {visionReport && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-white/40 uppercase tracking-wide">
                        Vision Analysis <span className="text-[#C9A96E]">({visionReport.model}{visionReport.wasFallback ? ' — fallback' : ''})</span>
                      </p>
                      <div className="p-3 rounded-lg bg-white/[0.03] border border-[#2a2a2a]">
                        <p className="text-sm text-white/70 mb-2">{visionReport.analysis}</p>
                        {visionReport.findings.map((f, i) => (
                          <p key={i} className="text-xs text-white/50 ml-3 mb-1">&#8226; {f}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {(researchFindings || visionReport) && phaseStatus[2] === 'complete' && (
                    <GoldButton onClick={() => { expandPhase(3); addToast('success', 'Findings approved'); }} testId="approve-findings-btn">
                      Approve Findings
                    </GoldButton>
                  )}
                </div>
              </PhaseCard>

              {/* Phase 3: Writer's Room */}
              <PhaseCard phase={3} title="Writer's Room" icon="&#9997;" status={phaseStatus[3]} collapsed={collapsedPhases[3]} onToggle={() => setCollapsedPhases(p => ({ ...p, 3: !p[3] }))}>
                <div className="space-y-4">
                  <GoldButton onClick={handleGenerateDraft} disabled={!tenantContext} loading={phaseStatus[3] === 'loading'} testId="generate-draft-btn">
                    Generate Draft
                  </GoldButton>

                  {draftResponse && (
                    <>
                      {/* Side-by-side drafts */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2">Original AI Draft</p>
                          <div className="p-3 rounded-lg bg-white/[0.03] border border-[#2a2a2a] text-sm text-white/60 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                            {draftResponse.originalDraft}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2">Enhanced Draft</p>
                          <div className="p-3 rounded-lg bg-white/[0.03] border border-[#C9A96E]/20 text-sm text-white/70 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                            {draftResponse.enhancedDraft}
                          </div>
                        </div>
                      </div>

                      {/* Review Notes */}
                      {draftResponse.reviewNotes.length > 0 && (
                        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                          <p className="text-xs font-medium text-blue-400 mb-1">Review Notes</p>
                          {draftResponse.reviewNotes.map((n, i) => (
                            <p key={i} className="text-xs text-white/50 ml-2">&#8226; {n}</p>
                          ))}
                        </div>
                      )}

                      {/* Rich Text Editor */}
                      <div>
                        <p className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2">Edit Draft</p>
                        {/* Toolbar */}
                        <div className="flex gap-1 p-1.5 border border-[#2a2a2a] border-b-0 rounded-t-lg bg-[#121212]">
                          {[
                            { cmd: 'bold', icon: 'B', style: 'font-bold' },
                            { cmd: 'italic', icon: 'I', style: 'italic' },
                            { cmd: 'underline', icon: 'U', style: 'underline' },
                          ].map(btn => (
                            <button
                              key={btn.cmd}
                              onClick={() => document.execCommand(btn.cmd)}
                              className={`w-7 h-7 rounded text-xs text-white/50 hover:text-white hover:bg-white/10 flex items-center justify-center ${btn.style}`}
                              title={btn.cmd}
                            >
                              {btn.icon}
                            </button>
                          ))}
                          <div className="w-px bg-[#2a2a2a] mx-1" />
                          <button onClick={() => document.execCommand('insertUnorderedList')} className="w-7 h-7 rounded text-xs text-white/50 hover:text-white hover:bg-white/10 flex items-center justify-center" title="Bullet list">&#8226;</button>
                        </div>
                        <div
                          ref={draftEditorRef}
                          contentEditable
                          suppressContentEditableWarning
                          onInput={() => setEditedDraft(draftEditorRef.current?.innerText || '')}
                          className="p-3 rounded-b-lg border border-[#2a2a2a] bg-[#121212] text-sm text-white/80 min-h-[150px] focus:outline-none focus:border-[#C9A96E]/30 whitespace-pre-wrap"
                          data-testid="draft-editor"
                          dangerouslySetInnerHTML={{ __html: editedDraft.replace(/\n/g, '<br>') }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </PhaseCard>

              {/* Phase 4: Visual Studio */}
              <PhaseCard phase={4} title="Visual Studio" icon="&#127912;" status={phaseStatus[4]} collapsed={collapsedPhases[4]} onToggle={() => setCollapsedPhases(p => ({ ...p, 4: !p[4] }))}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Image Prompt</label>
                    <textarea
                      value={imagePrompt}
                      onChange={e => setImagePrompt(e.target.value)}
                      rows={2}
                      placeholder="Describe the image to generate..."
                      className="w-full px-3 py-2.5 rounded-lg bg-[#121212] border border-[#2a2a2a] text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#C9A96E]/50 resize-y"
                      data-testid="image-prompt-input"
                    />
                    <p className="text-[11px] text-white/30 mt-1">Auto-generated from email content. Edit for manual overrides.</p>
                  </div>

                  <GoldButton onClick={handleGenerateImage} loading={imageLoading} testId="create-image-btn">
                    Create Image
                  </GoldButton>

                  {generatedImage && (
                    <div className="space-y-3">
                      <img src={generatedImage.url} alt="Generated" className="w-full max-w-sm rounded-xl border border-[#2a2a2a]" />
                      <GoldButton onClick={handleGenerateImage} loading={imageLoading}>
                        Regenerate
                      </GoldButton>
                    </div>
                  )}
                </div>
              </PhaseCard>

              {/* Phase 5: Preview & Assemble */}
              <PhaseCard phase={5} title="Preview & Assemble" icon="&#128065;" status={phaseStatus[5]} collapsed={collapsedPhases[5]} onToggle={() => setCollapsedPhases(p => ({ ...p, 5: !p[5] }))}>
                <div className="space-y-4">
                  {/* Subject Line */}
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Subject Line</label>
                    <input
                      type="text"
                      value={subjectLine}
                      onChange={e => setSubjectLine(e.target.value)}
                      placeholder="Email subject..."
                      className="w-full px-3 py-2.5 rounded-lg bg-[#121212] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-[#C9A96E]/50"
                      data-testid="subject-line-input"
                    />
                  </div>

                  {/* Email Template Selector */}
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Email Template</label>
                    <div className="flex flex-wrap gap-2">
                      {([
                        { value: 'campaign' as const, label: 'Campaign', desc: 'Short & punchy, one CTA' },
                        { value: 'newsletter' as const, label: 'Newsletter', desc: 'Multi-section, images' },
                        { value: 'report' as const, label: 'Report', desc: 'Long-form, detailed' },
                        { value: 'announcement' as const, label: 'Announce', desc: 'Bold header, key message' },
                        { value: 'personal' as const, label: 'Personal', desc: 'Simple, clean, minimal' },
                      ]).map(tmpl => (
                        <button
                          key={tmpl.value}
                          onClick={() => setEmailTemplate(tmpl.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                            emailTemplate === tmpl.value
                              ? 'bg-[#C9A96E]/20 border-[#C9A96E]/50 text-[#C9A96E]'
                              : 'bg-[#111] border-[#2a2a2a] text-white/50 hover:text-white/70 hover:border-[#3a3a3a]'
                          }`}
                          title={tmpl.desc}
                        >
                          {tmpl.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-white/30 mt-1">
                      {emailTemplate === 'campaign' && 'Short, punchy email with one primary CTA. Max-width 560px.'}
                      {emailTemplate === 'newsletter' && 'Multi-section layout with room for images. Max-width 600px.'}
                      {emailTemplate === 'report' && 'Long-form content with full hierarchy. Max-width 620px.'}
                      {emailTemplate === 'announcement' && 'Bold header with key message. Max-width 540px.'}
                      {emailTemplate === 'personal' && 'Simple, clean, minimal formatting. Max-width 520px.'}
                    </p>
                  </div>

                  {/* Content Block Toggles */}
                  <div>
                    <p className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2">Content Blocks</p>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { key: 'aiBody' as const, label: 'AI Body' },
                        { key: 'visionAddendum' as const, label: 'Vision Report' },
                        { key: 'generatedImage' as const, label: 'Generated Image' },
                        { key: 'qrCode' as const, label: 'QR Code' },
                      ].map(block => (
                        <label key={block.key} className="flex items-center gap-2 cursor-pointer">
                          <div
                            onClick={() => setContentToggles(prev => ({ ...prev, [block.key]: !prev[block.key] }))}
                            className={`w-9 h-5 rounded-full transition relative cursor-pointer ${contentToggles[block.key] ? 'bg-[#C9A96E]' : 'bg-[#333]'}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${contentToggles[block.key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </div>
                          <span className="text-xs text-white/60">{block.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div>
                    <p className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2">Live Preview</p>
                    <div className="rounded-xl border border-[#2a2a2a] overflow-hidden" style={{ background: '#0a0a0a' }}>
                      <div style={{ padding: '32px 16px', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                          <span style={{ color: '#C9A96E', fontSize: 20, fontWeight: 700 }}>GreenLine</span>
                          <span style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>365</span>
                          <p style={{ color: '#666', fontSize: 10, margin: '3px 0 0' }}>Florida&apos;s Gold Standard Business Directory</p>
                        </div>
                        <div style={{ background: '#1a1a1a', border: '1px solid rgba(201,169,110,0.19)', borderRadius: 12, padding: 24 }}>
                          <h2 style={{ color: '#fff', fontSize: 16, margin: '0 0 12px', fontWeight: 600 }}>{subjectLine || 'Subject line...'}</h2>
                          {assembledPreviewHtml ? (
                            <div dangerouslySetInnerHTML={{ __html: assembledPreviewHtml }} />
                          ) : (
                            <p style={{ color: '#555', fontSize: 13, fontStyle: 'italic' }}>Email content will appear here...</p>
                          )}
                        </div>
                        <div style={{ textAlign: 'center', marginTop: 16 }}>
                          <p style={{ color: '#444', fontSize: 9 }}>GreenLine365 &middot; Tampa, FL</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {(editedDraft || subjectLine) && (
                    <GoldButton onClick={() => { setPhase(5, 'complete'); expandPhase(6); }} testId="approve-preview-btn">
                      Approve Preview
                    </GoldButton>
                  )}
                </div>
              </PhaseCard>

              {/* Phase 6: Send & Track */}
              <PhaseCard phase={6} title="Send & Track" icon="&#128640;" status={phaseStatus[6]} collapsed={collapsedPhases[6]} onToggle={() => setCollapsedPhases(p => ({ ...p, 6: !p[6] }))}>
                <div className="space-y-4">
                  {/* Recipient */}
                  <div className="p-3 rounded-lg bg-white/[0.03] border border-[#2a2a2a] flex items-center gap-3">
                    <span className="text-xs text-white/40 shrink-0">TO:</span>
                    <span className="text-sm text-white/80 font-medium">{tenantContext?.email || 'No recipient selected'}</span>
                  </div>

                  {/* Engagement Toggle */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => setTrackEngagement(!trackEngagement)}
                      className={`w-9 h-5 rounded-full transition relative cursor-pointer ${trackEngagement ? 'bg-[#C9A96E]' : 'bg-[#333]'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${trackEngagement ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-sm text-white/60">Embed rating widget (thumbs up/down)</span>
                  </label>

                  <GoldButton
                    onClick={() => setShowConfirmModal(true)}
                    disabled={!tenantContext?.email || !subjectLine || !editedDraft}
                    loading={phaseStatus[6] === 'loading'}
                    testId="send-email-btn"
                  >
                    Send Email
                  </GoldButton>

                  {phaseStatus[6] === 'complete' && (
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 space-y-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-green-400 text-sm font-semibold">Email Sent Successfully</span>
                      </div>
                      <div className="text-xs space-y-1 text-green-400/70">
                        <p>To: {tenantContext?.email}</p>
                        <p>Subject: {subjectLine}</p>
                        <p>Sent: {new Date().toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </PhaseCard>
            </div>

            {/* Right Column: Content Aggregator (30%) */}
            <div className="w-[30%] space-y-4">
              <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider px-1">Content Aggregator</h2>

              {/* Slack Snippets */}
              <div className="border border-[#2a2a2a] rounded-xl bg-[#1a1a1a] p-4 space-y-3">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wide flex items-center gap-2">
                  <span>&#128172;</span> Slack Snippets
                </p>
                <textarea
                  value={slackInput}
                  onChange={e => setSlackInput(e.target.value)}
                  rows={3}
                  placeholder="Paste Slack messages..."
                  className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-[#2a2a2a] text-white text-xs placeholder-white/20 focus:outline-none focus:border-[#C9A96E]/50 resize-y"
                  data-testid="slack-input"
                />
                <button
                  onClick={handleConvertSlack}
                  disabled={!slackInput.trim()}
                  className="w-full px-3 py-2 rounded-lg border border-[#C9A96E]/30 text-[#C9A96E] text-xs font-medium hover:bg-[#C9A96E]/10 transition disabled:opacity-30"
                >
                  Convert to Email Tip
                </button>
              </div>

              {/* Blog-to-Email */}
              <div className="border border-[#2a2a2a] rounded-xl bg-[#1a1a1a] p-4 space-y-3">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wide flex items-center gap-2">
                  <span>&#128221;</span> Blog-to-Email
                </p>
                <input
                  type="url"
                  value={blogUrl}
                  onChange={e => setBlogUrl(e.target.value)}
                  placeholder="https://blog.example.com/..."
                  className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-[#2a2a2a] text-white text-xs placeholder-white/20 focus:outline-none focus:border-[#C9A96E]/50"
                  data-testid="blog-url-input"
                />
                <div className="flex gap-2">
                  {[
                    { label: 'Link', action: 'link' as const },
                    { label: 'QR Code', action: 'qr' as const },
                    { label: 'Micro-Summary', action: 'summary' as const },
                  ].map(btn => (
                    <button
                      key={btn.action}
                      onClick={() => handleBlogAction(btn.action)}
                      disabled={!blogUrl.trim()}
                      className="flex-1 px-2 py-1.5 rounded-lg border border-[#2a2a2a] text-white/50 text-[11px] font-medium hover:border-[#C9A96E]/30 hover:text-[#C9A96E] transition disabled:opacity-30"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* QR Generator */}
              <div className="border border-[#2a2a2a] rounded-xl bg-[#1a1a1a] p-4 space-y-3">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wide flex items-center gap-2">
                  <span>&#9635;</span> QR Generator
                </p>
                <button
                  onClick={handleGenerateQR}
                  className="w-full px-3 py-2 rounded-lg border border-[#C9A96E]/30 text-[#C9A96E] text-xs font-medium hover:bg-[#C9A96E]/10 transition"
                >
                  Generate Dynamic QR
                </button>
                {qrCodeUrl && (
                  <div className="text-center">
                    <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24 mx-auto rounded-lg border border-[#2a2a2a]" />
                  </div>
                )}
              </div>

              {/* Stash */}
              <div className="border border-[#2a2a2a] rounded-xl bg-[#1a1a1a] p-4 space-y-3">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wide flex items-center gap-2">
                  <span>&#128230;</span> Stash
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={stashInput}
                    onChange={e => setStashInput(e.target.value)}
                    placeholder="Save a snippet..."
                    className="flex-1 px-3 py-2 rounded-lg bg-[#121212] border border-[#2a2a2a] text-white text-xs placeholder-white/20 focus:outline-none focus:border-[#C9A96E]/50"
                    onKeyDown={e => e.key === 'Enter' && handleSaveToStash()}
                    data-testid="stash-input"
                  />
                  <button onClick={handleSaveToStash} className="px-3 py-2 rounded-lg border border-[#2a2a2a] text-white/50 text-xs hover:text-[#C9A96E] hover:border-[#C9A96E]/30 transition">+</button>
                </div>
                {stash.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-[#2a2a2a] group">
                    <p className="text-xs text-white/50 truncate flex-1">{item.content}</p>
                    <button
                      onClick={() => handleInjectStash(item)}
                      className="text-[10px] text-[#C9A96E] opacity-0 group-hover:opacity-100 transition shrink-0 ml-2"
                    >
                      Inject
                    </button>
                  </div>
                ))}
              </div>

              {/* Active Snippets */}
              {contentSnippets.length > 0 && (
                <div className="border border-[#C9A96E]/20 rounded-xl bg-[#C9A96E]/5 p-4 space-y-2">
                  <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-wide">Active Snippets ({contentSnippets.length})</p>
                  {contentSnippets.map(s => (
                    <div key={s.id} className="flex items-start gap-2 p-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                      <span className="text-[10px] text-[#C9A96E] bg-[#C9A96E]/10 px-1.5 py-0.5 rounded shrink-0">{s.source}</span>
                      <p className="text-xs text-white/60 flex-1 truncate">{s.content}</p>
                      <button
                        onClick={() => setContentSnippets(prev => prev.filter(cs => cs.id !== s.id))}
                        className="text-white/20 hover:text-red-400 text-xs shrink-0"
                      >x</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ============ AUTO-SEND PIPELINE MODE ============ */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Automation Rules</h2>
              <GoldButton onClick={() => setShowRuleBuilder(true)} testId="new-rule-btn">
                + New Rule
              </GoldButton>
            </div>

            {/* Rule Builder */}
            {showRuleBuilder && (
              <div className="border border-[#C9A96E]/30 rounded-xl bg-[#1a1a1a] p-5 space-y-4">
                <h3 className="text-sm font-bold text-white">Create Rule</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Rule Name</label>
                    <input
                      value={newRule.name}
                      onChange={e => setNewRule(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-[#C9A96E]/50"
                      placeholder="e.g. Welcome new leads"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Trigger Condition</label>
                    <input
                      value={newRule.trigger}
                      onChange={e => setNewRule(p => ({ ...p, trigger: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-[#C9A96E]/50"
                      placeholder="e.g. new_lead_created"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Template ID</label>
                    <input
                      value={newRule.templateId}
                      onChange={e => setNewRule(p => ({ ...p, templateId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-[#C9A96E]/50"
                      placeholder="Template ID or name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Schedule</label>
                    <input
                      value={newRule.schedule}
                      onChange={e => setNewRule(p => ({ ...p, schedule: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-[#121212] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-[#C9A96E]/50"
                      placeholder="e.g. immediate, daily, weekly"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRule.humanWaitGate}
                    onChange={e => setNewRule(p => ({ ...p, humanWaitGate: e.target.checked }))}
                    className="accent-[#C9A96E]"
                  />
                  <span className="text-sm text-white/60">Human-Wait Gate (require approval before send)</span>
                </label>
                <div className="flex gap-3">
                  <GoldButton onClick={handleCreateRule}>Create Rule</GoldButton>
                  <button onClick={() => setShowRuleBuilder(false)} className="px-4 py-2 rounded-lg border border-[#2a2a2a] text-white/50 text-sm hover:text-white transition">Cancel</button>
                </div>
              </div>
            )}

            {/* Rules List */}
            <div className="border border-[#2a2a2a] rounded-xl bg-[#1a1a1a] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2a2a]">
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase">Rule</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase">Trigger</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase">Schedule</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-white/40 uppercase">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-white/40 uppercase">HITL Gate</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-white/40 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {autoRules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-white/30">No automation rules yet</td>
                    </tr>
                  ) : (
                    autoRules.map(rule => (
                      <tr key={rule.id} className="border-b border-[#2a2a2a] last:border-0 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-sm text-white/80">{rule.name}</td>
                        <td className="px-4 py-3 text-xs text-white/50 font-mono">{rule.trigger}</td>
                        <td className="px-4 py-3 text-xs text-white/50">{rule.schedule || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggleRule(rule)}
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                              rule.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'
                            }`}
                          >
                            {rule.status}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div
                            onClick={() => handleToggleHumanGate(rule)}
                            className={`w-8 h-4 rounded-full transition relative cursor-pointer mx-auto ${rule.humanWaitGate ? 'bg-[#C9A96E]' : 'bg-[#333]'}`}
                          >
                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${rule.humanWaitGate ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDeleteRule(rule.id)} className="text-xs text-red-400/60 hover:text-red-400 transition">Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Execution Log */}
            <div>
              <h3 className="text-sm font-bold text-white/60 mb-3 uppercase tracking-wider">Pipeline Execution Log</h3>
              <div className="border border-[#2a2a2a] rounded-xl bg-[#1a1a1a] p-4">
                {executionLog.length === 0 ? (
                  <p className="text-sm text-white/30 text-center py-4">No executions yet</p>
                ) : (
                  <div className="space-y-2">
                    {executionLog.map(entry => (
                      <div key={entry.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-[#2a2a2a]">
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${entry.status === 'success' ? 'bg-green-400' : entry.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                          <span className="text-xs text-white/60">{entry.ruleName}</span>
                          <span className="text-xs text-white/30">&#8594; {entry.recipient}</span>
                        </div>
                        <span className="text-[11px] text-white/30">{new Date(entry.executedAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
