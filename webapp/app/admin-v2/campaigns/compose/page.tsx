'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Constants ──────────────────────────────────────────────────────
const SUBJECT_MAX = 80;
const SUBJECT_WARN = 60;

// ─── TipTap Toolbar ─────────────────────────────────────────────────
function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  const btnClass = (active: boolean) =>
    `p-1.5 rounded transition ${active ? 'bg-[#C9A84C]/20 text-[#C9A84C]' : 'text-white/50 hover:text-white hover:bg-white/10'}`;

  const setLink = useCallback(() => {
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('URL', prev || 'https://');
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-white/10 flex-wrap">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Bold">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"/><path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/></svg>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Italic">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))} title="Underline">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
      </button>
      <div className="w-px h-5 bg-white/15 mx-1" />
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Bullet List">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))} title="Numbered List">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="10" y1="6" x2="20" y2="6"/><line x1="10" y1="12" x2="20" y2="12"/><line x1="10" y1="18" x2="20" y2="18"/><text x="3" y="8" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">1</text><text x="3" y="14" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">2</text><text x="3" y="20" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">3</text></svg>
      </button>
      <div className="w-px h-5 bg-white/15 mx-1" />
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))} title="Quote">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"/></svg>
      </button>
      <button type="button" onClick={setLink} className={btnClass(editor.isActive('link'))} title="Insert Link">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
      </button>
      <div className="w-px h-5 bg-white/15 mx-1" />
      <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnClass(false)} title="Horizontal Rule">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="3" y1="12" x2="21" y2="12"/></svg>
      </button>
      <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={`${btnClass(false)} disabled:opacity-25`} title="Undo">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
      </button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={`${btnClass(false)} disabled:opacity-25`} title="Redo">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
      </button>
    </div>
  );
}

// ─── Send Confirmation Modal ────────────────────────────────────────
function SendConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  to,
  subject,
  sending,
  isTest,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  to: string;
  subject: string;
  sending: boolean;
  isTest: boolean;
}) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md rounded-xl overflow-hidden border border-white/10"
            style={{ background: '#111' }}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: isTest ? 'rgba(59,130,246,0.15)' : 'rgba(201,168,76,0.15)' }}>
                  <svg className="w-5 h-5" style={{ color: isTest ? '#3B82F6' : '#C9A84C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold">{isTest ? 'Send Test Email?' : 'Send Email?'}</h3>
                  <p className="text-white/40 text-xs">This action cannot be undone</p>
                </div>
              </div>

              <div className="rounded-lg p-3 mb-5 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-white/40 shrink-0 w-16">To:</span>
                  <span className="text-white/80 break-all">{to}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-white/40 shrink-0 w-16">Subject:</span>
                  <span className="text-white/80">{subject}</span>
                </div>
                {isTest && (
                  <div className="flex items-center gap-2 text-xs text-blue-400/80 mt-1 pt-2 border-t border-white/5">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Test email — will be sent with [TEST] prefix
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={sending}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={sending}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: isTest ? '#3B82F6' : 'linear-gradient(135deg, #C9A84C 0%, #8A6A1C 100%)' }}
                >
                  {sending ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Sending...
                    </>
                  ) : (
                    isTest ? 'Send Test' : 'Send Now'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Compose Page ──────────────────────────────────────────────
export default function ComposeEmailPage() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [isTestSend, setIsTestSend] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({ openOnClick: false, HTMLAttributes: { class: 'text-[#C9A84C] underline' } }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none px-4 py-3 min-h-[200px] outline-none focus:outline-none text-white/80 [&_a]:text-[#C9A84C] [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[#C9A84C]/40 [&_blockquote]:pl-4 [&_blockquote]:text-white/50',
      },
    },
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const getEditorHtml = () => editor?.getHTML() || '';
  const getEditorText = () => editor?.getText() || '';
  const hasBody = () => (getEditorText().trim().length > 0);

  const handleSend = async (test: boolean) => {
    const recipientEmail = test ? to || 'test@greenline365.com' : to;
    const emailSubject = test ? `[TEST] ${subject}` : subject;

    if (!recipientEmail || !emailSubject || !hasBody()) {
      showToast('error', 'Please fill in all fields');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/email/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject: emailSubject,
          body: getEditorText(),
          html_body: getEditorHtml(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', test ? `Test email sent to ${recipientEmail}` : `Email sent to ${recipientEmail}`);
        if (!test) {
          setTo('');
          setSubject('');
          editor?.commands.clearContent();
        }
      } else {
        showToast('error', data.error || 'Failed to send email');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Network error');
    } finally {
      setSending(false);
      setShowSendModal(false);
    }
  };

  const openSendModal = (test: boolean) => {
    if (!test && (!to || !subject || !hasBody())) {
      showToast('error', 'Please fill in all fields');
      return;
    }
    if (test && !hasBody()) {
      showToast('error', 'Please write some content first');
      return;
    }
    setIsTestSend(test);
    setShowSendModal(true);
  };

  // Subject character count
  const subjectLen = subject.length;
  const subjectColor = subjectLen > SUBJECT_MAX ? 'text-red-400' : subjectLen > SUBJECT_WARN ? 'text-amber-400' : 'text-white/30';

  return (
    <div className="min-h-screen bg-[#0a0a0a]" data-testid="compose-email-page">
      {/* Header with Breadcrumbs */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          {/* Breadcrumb nav */}
          <nav className="flex items-center gap-2 text-xs text-white/40 mb-3" data-testid="compose-breadcrumbs">
            <Link href="/admin-v2" className="hover:text-white/70 transition">Tactical Command Center</Link>
            <svg className="w-3 h-3 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            <Link href="/admin-v2/campaigns" className="hover:text-white/70 transition">Campaigns</Link>
            <svg className="w-3 h-3 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            <span className="text-[#C9A84C]">Compose</span>
          </nav>

          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-[#C9A84C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
              Compose Email
            </h1>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => openSendModal(true)}
                disabled={sending}
                className="px-4 py-2 rounded-lg text-xs font-medium border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition disabled:opacity-40 flex items-center gap-2"
                data-testid="send-test-btn"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Send Test Email
              </button>
              <button
                type="button"
                onClick={() => openSendModal(false)}
                disabled={sending || !to || !subject || !hasBody()}
                className="px-5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-white"
                style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #8A6A1C 100%)' }}
                data-testid="compose-send-btn"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                Send Email
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed top-20 right-6 z-50"
          >
            <div className={`px-5 py-3 rounded-lg border text-sm font-medium flex items-center gap-2 shadow-lg ${
              toast.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {toast.type === 'success' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              )}
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send Confirmation Modal */}
      <SendConfirmModal
        isOpen={showSendModal}
        onClose={() => { if (!sending) setShowSendModal(false); }}
        onConfirm={() => handleSend(isTestSend)}
        to={isTestSend ? (to || 'test@greenline365.com') : to}
        subject={isTestSend ? `[TEST] ${subject}` : subject}
        sending={sending}
        isTest={isTestSend}
      />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-5">
            {/* To field */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">To</label>
              <input
                type="email"
                value={to}
                onChange={e => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-[#333] text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#C9A84C]/50 transition"
                data-testid="compose-to"
              />
            </div>

            {/* Subject with character count */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-white/60">Subject</label>
                <span className={`text-xs font-mono tabular-nums transition ${subjectColor}`} data-testid="subject-char-count">
                  {subjectLen}/{SUBJECT_MAX}
                </span>
              </div>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Email subject line"
                maxLength={150}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-[#333] text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#C9A84C]/50 transition"
                data-testid="compose-subject"
              />
              {subjectLen > SUBJECT_MAX && (
                <p className="text-xs text-red-400/70 mt-1">Subject lines over {SUBJECT_MAX} characters may be truncated in email clients</p>
              )}
            </div>

            {/* TipTap Rich Text Editor */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">Body</label>
              <div
                className="rounded-lg bg-white/5 border border-[#333] overflow-hidden focus-within:border-[#C9A84C]/50 transition"
                data-testid="compose-body-editor"
              >
                <EditorToolbar editor={editor} />
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div>
            <label className="block text-sm font-medium text-white/60 mb-3">Live Preview</label>
            <div className="rounded-xl border border-[#333] overflow-hidden sticky top-28" style={{ background: '#0a0a0a' }}>
              <div style={{ padding: '32px 16px', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <span style={{ color: '#C9A96E', fontSize: 20, fontWeight: 700 }}>GreenLine</span>
                  <span style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>365</span>
                  <p style={{ color: '#666', fontSize: 10, margin: '3px 0 0' }}>Florida&apos;s Gold Standard Business Directory</p>
                </div>
                {/* Card */}
                <div style={{ background: '#1a1a1a', border: '1px solid rgba(201,169,110,0.19)', borderRadius: 12, padding: 24 }}>
                  <h2 style={{ color: '#fff', fontSize: 16, margin: '0 0 12px', fontWeight: 600 }}>
                    {subject || 'Your subject line'}
                  </h2>
                  {hasBody() ? (
                    <div
                      style={{ color: '#a0a0a0', fontSize: 13, lineHeight: 1.7 }}
                      className="[&_a]:text-[#C9A84C] [&_a]:underline [&_strong]:text-white [&_em]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-[#C9A84C]/40 [&_blockquote]:pl-3 [&_blockquote]:text-white/50 [&_p]:mb-3 [&_li]:mb-1"
                      dangerouslySetInnerHTML={{ __html: getEditorHtml() }}
                    />
                  ) : (
                    <p style={{ color: '#555', fontSize: 13, lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>Your message will appear here...</p>
                  )}
                </div>
                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <p style={{ color: '#444', fontSize: 9 }}>GreenLine365 &middot; Tampa, FL &middot; Florida Business Directory</p>
                  <p style={{ color: '#333', fontSize: 8, margin: '3px 0 0' }}>
                    &copy; {new Date().getFullYear()} GreenLine365. All rights reserved. &middot;{' '}
                    <span style={{ color: '#555', textDecoration: 'underline' }}>Unsubscribe</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
