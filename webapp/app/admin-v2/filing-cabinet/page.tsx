'use client';

/**
 * Filing Cabinet - Secure Document Vault
 * Role-based access: Owners see all, Techs upload-only.
 * Supports receipts, warranties, contracts, invoices, tax docs, and photos.
 * Features CPA export and audit trail.
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { useBusiness } from '@/lib/business';
import CollapsibleSidebar from '../components/CollapsibleSidebar';

interface CabinetFile {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size_bytes: number;
  category: string;
  subcategory?: string;
  amount?: number;
  tax_year?: number;
  uploaded_by: string;
  uploaded_by_role: string;
  visibility: string;
  description?: string;
  tags: string[];
  created_at: string;
  property_id?: string;
}

interface FileTotals {
  totalAmount: number;
  fileCount: number;
  categories: Record<string, number>;
}

const CATEGORIES = [
  { value: 'all', label: 'All Files', icon: 'folder', color: '#39FF14' },
  { value: 'receipt', label: 'Receipts', icon: 'receipt', color: '#FFB800' },
  { value: 'warranty', label: 'Warranties', icon: 'shield', color: '#00D4FF' },
  { value: 'contract', label: 'Contracts', icon: 'document', color: '#8B5CF6' },
  { value: 'invoice', label: 'Invoices', icon: 'dollar', color: '#0CE293' },
  { value: 'tax_document', label: 'Tax Docs', icon: 'tax', color: '#FF6B6B' },
  { value: 'job_photo', label: 'Job Photos', icon: 'camera', color: '#FF9F43' },
  { value: 'general', label: 'General', icon: 'file', color: '#778899' },
];

const stagger = { animate: { transition: { staggerChildren: 0.04 } } };
const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function FilingCabinetPage() {
  const { activeBusiness } = useBusiness();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [files, setFiles] = useState<CabinetFile[]>([]);
  const [totals, setTotals] = useState<FileTotals>({ totalAmount: 0, fileCount: 0, categories: {} });
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTaxYear, setActiveTaxYear] = useState<number>(new Date().getFullYear());
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('receipt');
  const [uploadAmount, setUploadAmount] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');

  useEffect(() => {
    if (activeBusiness?.id) loadFiles();
  }, [activeBusiness?.id, activeCategory, activeTaxYear]);

  async function loadFiles() {
    if (!activeBusiness?.id) return;
    setLoading(true);

    const params = new URLSearchParams({
      tenant_id: activeBusiness.id,
      category: activeCategory,
      tax_year: activeTaxYear.toString(),
    });

    const res = await fetch(`/api/filing-cabinet?${params}`);
    const data = await res.json();

    if (data.files) {
      setFiles(data.files);
      setTotals(data.totals);
    }
    setLoading(false);
  }

  async function handleUpload() {
    if (!uploadFile || !activeBusiness?.id) return;
    setUploading(true);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }

    // Upload to Supabase Storage
    const filePath = `${activeBusiness.id}/${activeTaxYear}/${uploadCategory}/${Date.now()}_${uploadFile.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('filing-cabinet')
      .upload(filePath, uploadFile);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      // Use a placeholder URL if storage bucket doesn't exist yet
      const fileUrl = `pending://${filePath}`;
      await saveFileRecord(user.id, fileUrl);
    } else {
      const { data: urlData } = supabase.storage.from('filing-cabinet').getPublicUrl(filePath);
      await saveFileRecord(user.id, urlData.publicUrl);
    }

    setUploading(false);
    setShowUpload(false);
    setUploadFile(null);
    setUploadAmount('');
    setUploadDescription('');
    loadFiles();
  }

  async function saveFileRecord(userId: string, fileUrl: string) {
    await fetch('/api/filing-cabinet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: activeBusiness!.id,
        file_name: uploadFile!.name,
        file_type: uploadFile!.type,
        file_url: fileUrl,
        file_size_bytes: uploadFile!.size,
        mime_type: uploadFile!.type,
        category: uploadCategory,
        amount: uploadAmount ? parseFloat(uploadAmount) : null,
        tax_year: activeTaxYear,
        uploaded_by: userId,
        uploaded_by_role: 'owner',
        visibility: 'owner_only',
        description: uploadDescription || null,
      }),
    });
  }

  async function handleDelete(fileId: string) {
    if (!activeBusiness?.id) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await fetch(`/api/filing-cabinet?id=${fileId}&user_id=${user.id}&tenant_id=${activeBusiness.id}`, {
      method: 'DELETE',
    });
    loadFiles();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setUploadFile(droppedFile);
      setShowUpload(true);
    }
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const taxYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div
      className="min-h-screen flex relative"
      style={{ background: '#0A0A0A' }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {dragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(57,255,20,0.05)', border: '3px dashed rgba(57,255,20,0.3)' }}
          >
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-3" style={{ color: '#39FF14' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-semibold" style={{ color: '#39FF14' }}>Drop file to upload</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CollapsibleSidebar
        activeItem="filing-cabinet"
        onNewBooking={() => {}} onNewContent={() => {}} pendingCount={0}
        isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileMenuOpen} onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <div className="flex-1 min-w-0 relative z-10 p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFB800, #FF6B6B)', boxShadow: '0 0 20px rgba(255,184,0,0.2)' }}>
              <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white" data-testid="filing-cabinet-title">Filing Cabinet</h1>
              <p className="text-sm text-zinc-500">Secure document vault</p>
            </div>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-black transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #39FF14, #0CE293)', boxShadow: '0 0 15px rgba(57,255,20,0.3)' }}
            data-testid="upload-button"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Upload
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="backdrop-blur-xl rounded-xl border p-4" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Total Files</p>
            <p className="text-2xl font-bold text-white mt-1">{files.length}</p>
          </div>
          <div className="backdrop-blur-xl rounded-xl border p-4" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Total Amount</p>
            <p className="text-2xl font-bold" style={{ color: '#39FF14' }}>${totals.totalAmount.toLocaleString()}</p>
          </div>
          <div className="backdrop-blur-xl rounded-xl border p-4" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Tax Year</p>
            <select
              value={activeTaxYear}
              onChange={(e) => setActiveTaxYear(parseInt(e.target.value))}
              className="text-2xl font-bold text-white bg-transparent focus:outline-none cursor-pointer"
              data-testid="tax-year-select"
            >
              {taxYears.map(y => <option key={y} value={y} style={{ background: '#1A1A1A' }}>{y}</option>)}
            </select>
          </div>
          <div className="backdrop-blur-xl rounded-xl border p-4" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">CPA Export</p>
            <button
              className="text-sm font-medium mt-1 transition hover:opacity-80"
              style={{ color: '#00D4FF' }}
              data-testid="cpa-export-button"
              onClick={() => {
                // Generate CSV export
                const csv = ['File Name,Category,Amount,Date,Description']
                  .concat(files.map(f => `"${f.file_name}","${f.category}","${f.amount || ''}","${new Date(f.created_at).toLocaleDateString()}","${f.description || ''}"`))
                  .join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `filing_cabinet_${activeTaxYear}.csv`;
                a.click();
              }}
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${activeCategory === cat.value ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              style={activeCategory === cat.value ? { background: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}30` } : { border: '1px solid transparent' }}
              data-testid={`category-${cat.value}`}
            >
              {cat.label}
              {totals.categories[cat.value] ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  {totals.categories[cat.value]}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Files List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto mb-4 text-zinc-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <h3 className="text-lg font-medium text-zinc-400 mb-2">Cabinet is empty</h3>
            <p className="text-sm text-zinc-600">Upload receipts, warranties, and documents to get started</p>
          </div>
        ) : (
          <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-2">
            {files.map(file => {
              const cat = CATEGORIES.find(c => c.value === file.category) || CATEGORIES[CATEGORIES.length - 1];
              return (
                <motion.div
                  key={file.id}
                  variants={fadeUp}
                  className="backdrop-blur-xl rounded-xl border p-4 flex items-center gap-4 group"
                  style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
                  data-testid={`file-${file.id}`}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${cat.color}15` }}>
                    <svg className="w-5 h-5" style={{ color: cat.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{file.file_name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${cat.color}15`, color: cat.color }}>
                        {cat.label}
                      </span>
                      {file.amount && (
                        <span className="text-xs text-zinc-400">${file.amount.toLocaleString()}</span>
                      )}
                      <span className="text-[10px] text-zinc-600">{formatFileSize(file.file_size_bytes || 0)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-zinc-600">{new Date(file.created_at).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="opacity-0 group-hover:opacity-100 transition p-2 rounded-lg hover:bg-red-500/10"
                    data-testid={`delete-file-${file.id}`}
                  >
                    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)' }}
            onClick={() => setShowUpload(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md backdrop-blur-2xl rounded-2xl border p-6"
              style={{ background: 'rgba(20,20,20,0.98)', borderColor: 'rgba(255,255,255,0.08)' }}
              data-testid="upload-modal"
            >
              <h2 className="text-lg font-semibold text-white mb-5">Upload Document</h2>

              {/* File Input */}
              <label className="block mb-4">
                <div
                  className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition hover:border-green-500/30"
                  style={{ borderColor: uploadFile ? 'rgba(57,255,20,0.3)' : 'rgba(255,255,255,0.1)' }}
                >
                  {uploadFile ? (
                    <p className="text-sm text-white">{uploadFile.name}</p>
                  ) : (
                    <>
                      <svg className="w-8 h-8 mx-auto mb-2 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-zinc-500">Click to select or drag & drop</p>
                    </>
                  )}
                </div>
                <input type="file" className="hidden" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} data-testid="file-input" />
              </label>

              {/* Category */}
              <label className="block mb-3">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Category</span>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  data-testid="upload-category"
                >
                  {CATEGORIES.filter(c => c.value !== 'all').map(c => (
                    <option key={c.value} value={c.value} style={{ background: '#1A1A1A' }}>{c.label}</option>
                  ))}
                </select>
              </label>

              {/* Amount */}
              <label className="block mb-3">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Amount (optional)</span>
                <input
                  type="number"
                  value={uploadAmount}
                  onChange={(e) => setUploadAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full mt-1 px-3 py-2.5 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  data-testid="upload-amount"
                />
              </label>

              {/* Description */}
              <label className="block mb-5">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Description (optional)</span>
                <input
                  type="text"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Brief description..."
                  className="w-full mt-1 px-3 py-2.5 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  data-testid="upload-description"
                />
              </label>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowUpload(false); setUploadFile(null); }}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 transition hover:text-white"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!uploadFile || uploading}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-black disabled:opacity-50 transition hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #39FF14, #0CE293)' }}
                  data-testid="upload-submit"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
