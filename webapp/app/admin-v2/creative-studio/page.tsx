'use client';

/**
 * ArtfulPhusion Creative Studio
 * Full Implementation with AI Analysis & Mockup Generation
 * 
 * FIXES APPLIED:
 * - Product Library items now clickable with detail/re-run
 * - Mockup images properly displayed
 * - Scene selection with preview images
 * - Product URL input added
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useBusiness } from '@/lib/business';
import { useCostTracking } from '@/lib/cost-tracking';
import CollapsibleSidebar from '../components/CollapsibleSidebar';
import TacticalHeader from '../components/TacticalHeader';
import { 
  Upload, Sparkles, Users, Image, Download, Share2, Folder,
  Plus, Camera, Wand2, Eye, ChevronRight, X, Check, Loader2,
  RefreshCw, Trash2, Star, Grid, List, ArrowRight, Link, ExternalLink
} from 'lucide-react';

// Product types
const PRODUCT_TYPES = [
  { id: 'apparel', label: 'Apparel', icon: '👕', description: 'Clothing & fashion' },
  { id: 'wall_art', label: 'Wall Art', icon: '🖼️', description: 'Prints, canvases' },
  { id: 'accessories', label: 'Accessories', icon: '👜', description: 'Bags, watches' },
  { id: 'jewelry', label: 'Jewelry', icon: '💎', description: 'Rings, necklaces' },
  { id: 'home_decor', label: 'Home Decor', icon: '🏠', description: 'Furniture, decor' },
  { id: 'packaging', label: 'Packaging', icon: '📦', description: 'Boxes, bottles' },
  { id: 'footwear', label: 'Footwear', icon: '👟', description: 'Shoes, boots' },
  { id: 'default', label: 'Other', icon: '📸', description: 'General products' },
];

// Scene presets with preview images
const SCENE_PRESETS = [
  { 
    id: 'minimalist', 
    slug: 'minimalist_studio', 
    name: 'Minimalist Studio', 
    description: 'Clean white background with soft shadows',
    preview: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
    category: 'studio'
  },
  { 
    id: 'lifestyle', 
    slug: 'lifestyle_living', 
    name: 'Lifestyle Living Room', 
    description: 'Cozy home environment setting',
    preview: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=200&fit=crop',
    category: 'lifestyle'
  },
  { 
    id: 'golden_hour', 
    slug: 'golden_hour', 
    name: 'Golden Hour Outdoor', 
    description: 'Warm sunset lighting outdoors',
    preview: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop',
    category: 'outdoor'
  },
  { 
    id: 'urban', 
    slug: 'urban_street', 
    name: 'Urban Street', 
    description: 'City backdrop with modern vibes',
    preview: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=200&fit=crop',
    category: 'outdoor'
  },
  { 
    id: 'flatlay', 
    slug: 'flat_lay', 
    name: 'Flat Lay Styled', 
    description: 'Top-down with curated props',
    preview: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop',
    category: 'studio'
  },
  { 
    id: 'nature', 
    slug: 'nature_macro', 
    name: 'Nature Macro', 
    description: 'Natural elements close-up',
    preview: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=200&fit=crop',
    category: 'outdoor'
  },
];

interface Product {
  id: string;
  name: string;
  description: string;
  product_type: string;
  original_images: string[];
  ai_analysis: any;
  status: string;
  created_at: string;
  mockups?: { id: string; image_url: string; scene_id: string }[];
}

interface SignatureModel {
  id: string;
  name: string;
  model_type: 'photo_seed' | 'virtual';
  preview_url: string | null;
  ethnicity?: string;
  age_range?: string;
  style_tags: string[];
}

export default function CreativeStudioPage() {
  const router = useRouter();
  const { activeBusiness, hasFeature } = useBusiness();
  const { requestConfirmation } = useCostTracking();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [activeTab, setActiveTab] = useState<'upload' | 'vault' | 'library'>('upload');
  const [step, setStep] = useState(1);
  const [selectedProductType, setSelectedProductType] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [productName, setProductName] = useState('');
  
  // NEW: Product URL input
  const [productUrl, setProductUrl] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  
  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [signatureModels, setSignatureModels] = useState<SignatureModel[]>([]);
  const [selectedScenes, setSelectedScenes] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  
  // Mockup generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMockups, setGeneratedMockups] = useState<{url: string; scene: string}[]>([]);
  
  // NEW: Product detail modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  
  // Sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?redirectTo=/admin-v2/creative-studio');
      }
    };
    checkAuth();
  }, [router]);

  // Load data
  useEffect(() => {
    if (activeBusiness) {
      loadProducts();
      loadSignatureModels();
    }
  }, [activeBusiness]);

  const loadProducts = async () => {
    if (!activeBusiness) return;
    
    // Load products with their mockups
    const { data: productsData } = await supabase
      .from('studio_products')
      .select('*')
      .eq('business_id', activeBusiness.id)
      .order('created_at', { ascending: false });
    
    if (productsData) {
      // Load mockups for each product
      const productsWithMockups = await Promise.all(
        productsData.map(async (product) => {
          const { data: mockups } = await supabase
            .from('studio_mockups')
            .select('*')
            .eq('product_id', product.id);
          return { ...product, mockups: mockups || [] };
        })
      );
      setProducts(productsWithMockups);
    }
  };

  const loadSignatureModels = async () => {
    if (!activeBusiness) return;
    const { data } = await supabase
      .from('signature_models')
      .select('*')
      .eq('business_id', activeBusiness.id)
      .eq('is_active', true);
    if (data) setSignatureModels(data);
  };

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files].slice(0, 5));
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files].slice(0, 5));
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // NEW: Load image from URL
  const loadImageFromUrl = async () => {
    if (!productUrl.trim()) return;
    
    setIsLoadingUrl(true);
    try {
      // Validate URL
      new URL(productUrl);
      
      // Add the URL to uploadedUrls directly
      setUploadedUrls(prev => [...prev, productUrl].slice(0, 5));
      setProductUrl('');
    } catch (error) {
      alert('Please enter a valid URL');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // Upload files to Supabase Storage
  const uploadFiles = async (): Promise<string[]> => {
    if (!activeBusiness) return uploadedUrls; // Return existing URLs if we have them
    
    // If we already have URLs (from URL input), return them
    if (uploadedUrls.length > 0 && uploadedFiles.length === 0) {
      return uploadedUrls;
    }
    
    if (uploadedFiles.length === 0) return [];
    
    setIsUploading(true);
    const urls: string[] = [...uploadedUrls]; // Start with existing URLs
    
    try {
      for (const file of uploadedFiles) {
        const ext = file.name.split('.').pop();
        const path = `${activeBusiness.id}/products/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        
        const { data, error } = await supabase.storage
          .from('studio-assets')
          .upload(path, file);
        
        if (error) {
          console.error('Upload error:', error);
          continue;
        }
        
        const { data: urlData } = supabase.storage
          .from('studio-assets')
          .getPublicUrl(path);
        
        urls.push(urlData.publicUrl);
      }
      
      setUploadedUrls(urls);
      return urls;
    } finally {
      setIsUploading(false);
    }
  };

  // AI Analysis (with cost confirmation)
  const analyzeProduct = async () => {
    if ((uploadedFiles.length === 0 && uploadedUrls.length === 0) || !selectedProductType) return;
    
    // Request cost confirmation
    requestConfirmation(
      '/api/studio/analyze-product',
      1,
      async () => {
        setIsAnalyzing(true);
        
        try {
          // First upload files if any
          const imageUrls = await uploadFiles();
          if (imageUrls.length === 0) {
            throw new Error('No images uploaded');
          }
          
          // Call AI analysis API
          const response = await fetch('/api/studio/analyze-product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrls,
              productType: selectedProductType,
            }),
          });
          
          if (!response.ok) {
            throw new Error('Analysis failed');
          }
          
          const result = await response.json();
          setAnalysisResult(result.analysis);
          setProductName(result.analysis?.name || `${selectedProductType} Product`);
          setStep(3);
          
        } catch (error) {
          console.error('Analysis error:', error);
          alert('Analysis failed. Please try again.');
        } finally {
          setIsAnalyzing(false);
        }
      },
      { productType: selectedProductType, imageCount: uploadedFiles.length + uploadedUrls.length }
    );
  };

  // Save product
  const saveProduct = async () => {
    if (!activeBusiness || !analysisResult) return;
    
    try {
      const { data, error } = await supabase
        .from('studio_products')
        .insert({
          business_id: activeBusiness.id,
          name: productName,
          description: analysisResult.description,
          product_type: selectedProductType,
          original_images: uploadedUrls,
          ai_analysis: analysisResult,
          status: 'analyzed',
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Refresh products list
      loadProducts();
      setStep(4);
      
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save product');
    }
  };

  // Generate mockups (with cost confirmation)
  const generateMockups = async () => {
    if (selectedScenes.length === 0) return;
    
    requestConfirmation(
      '/api/studio/generate-mockups',
      selectedScenes.length,
      async () => {
        setIsGenerating(true);
        setGeneratedMockups([]);
        
        try {
          const response = await fetch('/api/studio/generate-mockups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productImageUrl: uploadedUrls[0],
              productType: selectedProductType,
              productDescription: analysisResult?.description || productName,
              scenes: selectedScenes,
              signatureModelId: selectedModel,
            }),
          });
          
          if (!response.ok) throw new Error('Generation failed');
          
          const result = await response.json();
          
          // Format mockups - API returns {scene, imageUrl} objects
          const mockups = (result.mockups || []).map((mockup: any) => ({
            url: typeof mockup === 'string' ? mockup : (mockup.imageUrl || mockup.url),
            scene: typeof mockup === 'string' ? 'unknown' : (mockup.scene || 'unknown')
          }));
          
          setGeneratedMockups(mockups);
          setStep(5);
          
        } catch (error) {
          console.error('Generation error:', error);
          alert('Mockup generation failed');
        } finally {
          setIsGenerating(false);
        }
      },
      { scenes: selectedScenes, productType: selectedProductType }
    );
  };

  // Re-run mockups for existing product
  const rerunMockups = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDetail(false);
    
    // Pre-fill data from product
    setProductName(product.name);
    setAnalysisResult(product.ai_analysis);
    setUploadedUrls(product.original_images || []);
    setSelectedProductType(product.product_type);
    
    // Go to scene selection step
    setActiveTab('upload');
    setStep(4);
  };

  // Reset flow
  const resetFlow = () => {
    setStep(1);
    setSelectedProductType(null);
    setUploadedFiles([]);
    setUploadedUrls([]);
    setAnalysisResult(null);
    setProductName('');
    setSelectedScenes([]);
    setSelectedModel(null);
    setGeneratedMockups([]);
    setProductUrl('');
    setUploadMode('file');
  };

  // Feature gate
  if (!hasFeature('mockup_generator')) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <Sparkles className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">Creative Studio</h2>
          <p className="text-white/60 mb-6">Upgrade to Professional to access AI-powered product photography.</p>
          <button className="px-6 py-3 bg-gradient-to-r from-[#39FF14] to-[#0CE293] text-black font-bold rounded-xl">
            Upgrade Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0A0A0A]">
      <CollapsibleSidebar
        activeItem="creative-studio"
        onNewBooking={() => {}}
        onNewContent={() => {}}
        pendingCount={0}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileMenuOpen}
        onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <div className="flex-1 min-w-0">
        <TacticalHeader
          title="CREATIVE STUDIO"
          subtitle="ARTFULPHUSION • AI-POWERED PRODUCT PHOTOGRAPHY"
          onToday={() => {}}
          onPrev={() => {}}
          onNext={() => {}}
          viewMode="month"
          onViewChange={() => {}}
        />

        <main className="p-6 lg:p-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            {[
              { id: 'upload', label: 'Create New', icon: Plus },
              { id: 'vault', label: 'Character Vault', icon: Users },
              { id: 'library', label: 'Product Library', icon: Folder },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); if (tab.id === 'upload') resetFlow(); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* === CREATE NEW TAB === */}
          {activeTab === 'upload' && (
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-8 px-4">
                {['Select Type', 'Upload Photos', 'AI Analysis', 'Select Scenes', 'Results'].map((label, i) => (
                  <div key={label} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition ${
                      step > i + 1 ? 'bg-green-500 text-white' :
                      step === i + 1 ? 'bg-purple-500 text-white' :
                      'bg-white/10 text-white/40'
                    }`}>
                      {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className={`ml-2 text-sm hidden sm:block ${step >= i + 1 ? 'text-white' : 'text-white/40'}`}>
                      {label}
                    </span>
                    {i < 4 && <ChevronRight className="w-4 h-4 mx-2 text-white/20" />}
                  </div>
                ))}
              </div>

              {/* Step 1: Select Product Type */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl bg-white/5 border border-white/10"
                >
                  <h3 className="text-xl font-bold text-white mb-2">What are you creating?</h3>
                  <p className="text-white/50 mb-6">Select your product type for optimized AI analysis</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {PRODUCT_TYPES.map(type => (
                      <button
                        key={type.id}
                        onClick={() => { setSelectedProductType(type.id); setStep(2); }}
                        className={`p-4 rounded-xl text-left transition hover:scale-[1.02] ${
                          selectedProductType === type.id
                            ? 'bg-purple-500/20 border-2 border-purple-500'
                            : 'bg-white/5 border border-white/10 hover:border-purple-500/50'
                        }`}
                      >
                        <span className="text-3xl mb-2 block">{type.icon}</span>
                        <p className="font-medium text-white">{type.label}</p>
                        <p className="text-xs text-white/50">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Upload Photos - UPDATED with URL input */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">Upload Product Images</h3>
                      <p className="text-white/50">Add photos or paste a product URL</p>
                    </div>
                    <button
                      onClick={() => setStep(1)}
                      className="text-white/50 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Upload Mode Toggle */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setUploadMode('file')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition ${
                        uploadMode === 'file' 
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                          : 'bg-white/5 text-white/60 border border-white/10'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      Upload Files
                    </button>
                    <button
                      onClick={() => setUploadMode('url')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition ${
                        uploadMode === 'url' 
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                          : 'bg-white/5 text-white/60 border border-white/10'
                      }`}
                    >
                      <Link className="w-4 h-4" />
                      Paste URL
                    </button>
                  </div>

                  {/* File Upload Mode */}
                  {uploadMode === 'file' && (
                    <div
                      onDrop={handleFileDrop}
                      onDragOver={(e) => e.preventDefault()}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500/50 transition"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Upload className="w-12 h-12 text-white/30 mx-auto mb-4" />
                      <p className="text-white font-medium">Drop images here or click to upload</p>
                      <p className="text-white/50 text-sm mt-1">PNG, JPG up to 10MB each (max 5)</p>
                    </div>
                  )}

                  {/* URL Input Mode */}
                  {uploadMode === 'url' && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          ref={urlInputRef}
                          type="url"
                          value={productUrl}
                          onChange={(e) => setProductUrl(e.target.value)}
                          placeholder="https://example.com/product-image.jpg"
                          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-purple-500 focus:outline-none"
                        />
                        <button
                          onClick={loadImageFromUrl}
                          disabled={!productUrl.trim() || isLoadingUrl}
                          className="px-4 py-3 rounded-xl bg-purple-500 text-white font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                          {isLoadingUrl ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          Add
                        </button>
                      </div>
                      <p className="text-white/40 text-xs">
                        Paste a direct link to your product image. Works with most image URLs.
                      </p>
                    </div>
                  )}

                  {/* Preview uploaded files/URLs */}
                  {(uploadedFiles.length > 0 || uploadedUrls.length > 0) && (
                    <div className="mt-4">
                      <p className="text-sm text-white/60 mb-2">
                        {uploadedFiles.length + uploadedUrls.length} image(s) added
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {/* Show file previews */}
                        {uploadedFiles.map((file, i) => (
                          <div key={`file-${i}`} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => removeFile(i)}
                              className="absolute top-1 right-1 p-1 rounded-full bg-black/70 opacity-0 group-hover:opacity-100 transition"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                        {/* Show URL previews */}
                        {uploadedUrls.map((url, i) => (
                          <div key={`url-${i}`} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                            <img
                              src={url}
                              alt={`Image ${i + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect fill="%23333" width="80" height="80"/><text fill="%23666" x="40" y="45" text-anchor="middle" font-size="10">Error</text></svg>';
                              }}
                            />
                            <button
                              onClick={() => setUploadedUrls(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute top-1 right-1 p-1 rounded-full bg-black/70 opacity-0 group-hover:opacity-100 transition"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => setStep(1)}
                          className="px-4 py-2 rounded-lg bg-white/10 text-white"
                        >
                          Back
                        </button>
                        <button
                          onClick={analyzeProduct}
                          disabled={isAnalyzing || isUploading || (uploadedFiles.length === 0 && uploadedUrls.length === 0)}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-500 text-white font-bold disabled:opacity-50"
                        >
                          {isAnalyzing || isUploading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              {isUploading ? 'Uploading...' : 'Analyzing...'}
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-5 h-5" />
                              Analyze with AI
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Review AI Analysis */}
              {step === 3 && analysisResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">AI Analysis Complete</h3>
                      <p className="text-white/50">Review and edit the details below</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Preview */}
                    <div className="space-y-4">
                      <div className="aspect-square rounded-xl overflow-hidden bg-white/10">
                        {uploadedUrls[0] && (
                          <img src={uploadedUrls[0]} alt="Product" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex gap-2">
                        {uploadedUrls.slice(1).map((url, i) => (
                          <div key={i} className="w-16 h-16 rounded-lg overflow-hidden bg-white/10">
                            <img src={url} alt={`View ${i + 2}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">Product Name</label>
                        <input
                          type="text"
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">Description</label>
                        <textarea
                          value={analysisResult.description || ''}
                          onChange={(e) => setAnalysisResult({ ...analysisResult, description: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
                        />
                      </div>

                      {analysisResult.materials && (
                        <div>
                          <label className="block text-sm font-medium text-white/70 mb-1">Materials</label>
                          <div className="flex flex-wrap gap-2">
                            {analysisResult.materials.map((m: string, i: number) => (
                              <span key={i} className="px-2 py-1 rounded-full bg-white/10 text-white/70 text-xs">
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={saveProduct}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-600"
                      >
                        Continue to Mockups
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Select Scenes - UPDATED with preview images */}
              {step === 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Scene Selection with Previews */}
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-2">Select Scenes (6-Pack)</h3>
                    <p className="text-white/50 mb-4">Choose up to 6 scenes for your mockups</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {SCENE_PRESETS.map(scene => (
                        <button
                          key={scene.id}
                          onClick={() => {
                            if (selectedScenes.includes(scene.slug)) {
                              setSelectedScenes(prev => prev.filter(s => s !== scene.slug));
                            } else if (selectedScenes.length < 6) {
                              setSelectedScenes(prev => [...prev, scene.slug]);
                            }
                          }}
                          className={`rounded-xl overflow-hidden text-left transition ${
                            selectedScenes.includes(scene.slug)
                              ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-[#0A0A0A]'
                              : 'hover:ring-1 hover:ring-purple-500/50'
                          }`}
                        >
                          {/* Preview Image */}
                          <div className="aspect-video relative">
                            <img 
                              src={scene.preview} 
                              alt={scene.name}
                              className="w-full h-full object-cover"
                            />
                            {selectedScenes.includes(scene.slug) && (
                              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <p className="font-medium text-white text-sm">{scene.name}</p>
                              <p className="text-xs text-white/60">{scene.description}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    
                    <p className="text-center text-white/40 text-sm mt-4">
                      {selectedScenes.length}/6 scenes selected
                    </p>
                  </div>

                  {/* Model Selection (Optional) */}
                  {signatureModels.length > 0 && (
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                      <h3 className="text-lg font-bold text-white mb-4">Select Signature Model (Optional)</h3>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        <button
                          onClick={() => setSelectedModel(null)}
                          className={`flex-shrink-0 p-3 rounded-xl ${
                            !selectedModel ? 'bg-purple-500/20 border-2 border-purple-500' : 'bg-white/5 border border-white/10'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-1">
                            <X className="w-5 h-5 text-white/50" />
                          </div>
                          <p className="text-xs text-white/70">No Model</p>
                        </button>
                        {signatureModels.map(model => (
                          <button
                            key={model.id}
                            onClick={() => setSelectedModel(model.id)}
                            className={`flex-shrink-0 p-3 rounded-xl ${
                              selectedModel === model.id ? 'bg-purple-500/20 border-2 border-purple-500' : 'bg-white/5 border border-white/10'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden mb-1">
                              {model.preview_url ? (
                                <img src={model.preview_url} alt={model.name} className="w-full h-full object-cover" />
                              ) : (
                                <Users className="w-5 h-5 text-white/50 m-auto mt-3" />
                              )}
                            </div>
                            <p className="text-xs text-white/70">{model.name}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Generate Button */}
                  <button
                    onClick={generateMockups}
                    disabled={selectedScenes.length === 0 || isGenerating}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating {selectedScenes.length} Mockups...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate {selectedScenes.length} Mockups
                      </>
                    )}
                  </button>
                </motion.div>
              )}

              {/* Step 5: Results - UPDATED to handle image display */}
              {step === 5 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white">Your Mockups are Ready!</h3>
                      <p className="text-white/50">{generatedMockups.length} mockups generated</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20">
                        <Download className="w-4 h-4" />
                        Download All
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600">
                        <Share2 className="w-4 h-4" />
                        Export to Social
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {generatedMockups.length > 0 ? (
                      generatedMockups.map((mockup, i) => (
                        <div key={i} className="relative group rounded-xl overflow-hidden bg-white/10">
                          <img 
                            src={mockup.url} 
                            alt={`Mockup ${i + 1}`} 
                            className="w-full aspect-square object-cover"
                            onError={(e) => {
                              // Show placeholder on error
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                              const placeholder = document.createElement('div');
                              placeholder.className = 'text-center p-4';
                              placeholder.innerHTML = '<p class="text-white/40 text-sm">Image loading...</p>';
                              target.parentElement!.appendChild(placeholder);
                            }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-xs text-white/70 capitalize">{mockup.scene.replace(/_/g, ' ')}</p>
                          </div>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                            <a 
                              href={mockup.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-white/20 hover:bg-white/30"
                            >
                              <ExternalLink className="w-5 h-5 text-white" />
                            </a>
                            <button className="p-2 rounded-lg bg-white/20 hover:bg-white/30">
                              <Download className="w-5 h-5 text-white" />
                            </button>
                            <button className="p-2 rounded-lg bg-white/20 hover:bg-white/30">
                              <Star className="w-5 h-5 text-white" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-4" />
                        <p className="text-white/60">Generating your mockups...</p>
                        <p className="text-white/40 text-sm mt-1">This may take a minute</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={resetFlow}
                      className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20"
                    >
                      Create Another Product
                    </button>
                    <button
                      onClick={() => setActiveTab('library')}
                      className="flex-1 px-4 py-3 rounded-xl bg-purple-500 text-white hover:bg-purple-600"
                    >
                      View in Library
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* === CHARACTER VAULT TAB === */}
          {activeTab === 'vault' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Signature Models</h2>
                  <p className="text-white/50">Create consistent AI-generated models for your brand</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white font-bold rounded-xl">
                  <Plus className="w-5 h-5" />
                  Create Model
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Photo-to-Seed Option */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Photo-to-Seed</h3>
                      <p className="text-sm text-white/50">Upload reference photos</p>
                    </div>
                  </div>
                  <p className="text-white/60 text-sm mb-4">
                    Upload photos of a real model to create a persistent Identity Seed.
                  </p>
                  <button className="w-full py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30">
                    Upload Reference Photos
                  </button>
                </div>

                {/* Virtual Generation Option */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Wand2 className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Virtual Generation</h3>
                      <p className="text-sm text-white/50">AI-generated models</p>
                    </div>
                  </div>
                  <p className="text-white/60 text-sm mb-4">
                    Define your ideal model using ethnicity, age, and style parameters.
                  </p>
                  <button className="w-full py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30">
                    Generate Virtual Model
                  </button>
                </div>
              </div>

              {/* Existing Models */}
              {signatureModels.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                  {signatureModels.map(model => (
                    <div key={model.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="w-full aspect-square rounded-lg bg-white/10 mb-3 overflow-hidden">
                        {model.preview_url ? (
                          <img src={model.preview_url} alt={model.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Users className="w-8 h-8 text-white/20" />
                          </div>
                        )}
                      </div>
                      <p className="font-medium text-white">{model.name}</p>
                      <p className="text-xs text-white/50">{model.model_type === 'photo_seed' ? 'Photo Seed' : 'Virtual'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === PRODUCT LIBRARY TAB - UPDATED with clickable items === */}
          {activeTab === 'library' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Product Library</h2>
                  <p className="text-white/50">{products.length} products saved</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20">
                    <Grid className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-lg bg-white/5 text-white/50 hover:bg-white/10">
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="p-12 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <Folder className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No products yet</h3>
                  <p className="text-white/50 mb-6">Start by creating your first product</p>
                  <button 
                    onClick={() => { setActiveTab('upload'); resetFlow(); }}
                    className="px-6 py-3 bg-purple-500 text-white font-bold rounded-xl"
                  >
                    Create Your First Product
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map(product => (
                    <div 
                      key={product.id} 
                      onClick={() => { setSelectedProduct(product); setShowProductDetail(true); }}
                      className="rounded-xl bg-white/5 border border-white/10 overflow-hidden cursor-pointer hover:border-purple-500/50 hover:bg-white/[0.07] transition group"
                    >
                      <div className="aspect-square bg-white/10 relative">
                        {product.original_images?.[0] && (
                          <img src={product.original_images[0]} alt={product.name} className="w-full h-full object-cover" />
                        )}
                        {/* Mockup count badge */}
                        {product.mockups && product.mockups.length > 0 && (
                          <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-purple-500/80 text-white text-xs font-medium">
                            {product.mockups.length} mockups
                          </div>
                        )}
                        {/* Hover overlay with actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
                          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium">
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-white truncate">{product.name}</p>
                        <p className="text-xs text-white/50 capitalize">{product.product_type.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* === PRODUCT DETAIL MODAL === */}
      <AnimatePresence>
        {showProductDetail && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowProductDetail(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-4xl max-h-[90vh] bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedProduct.name}</h2>
                  <p className="text-white/50 text-sm capitalize">{selectedProduct.product_type.replace(/_/g, ' ')}</p>
                </div>
                <button 
                  onClick={() => setShowProductDetail(false)}
                  className="p-2 hover:bg-white/10 rounded-lg"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left: Product Images */}
                  <div>
                    <h3 className="text-sm font-medium text-white/70 mb-3">Original Images</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedProduct.original_images?.map((url, i) => (
                        <div key={i} className="aspect-square rounded-lg overflow-hidden bg-white/10">
                          <img src={url} alt={`${selectedProduct.name} ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>

                    {/* AI Analysis */}
                    {selectedProduct.ai_analysis && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-white/70 mb-2">AI Analysis</h3>
                        <p className="text-white/60 text-sm">{selectedProduct.ai_analysis.description || selectedProduct.description}</p>
                        {selectedProduct.ai_analysis.materials && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selectedProduct.ai_analysis.materials.map((m: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-xs">{m}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Generated Mockups */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-white/70">Generated Mockups</h3>
                      <button
                        onClick={() => rerunMockups(selectedProduct)}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-medium hover:bg-purple-500/30"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Generate New
                      </button>
                    </div>
                    
                    {selectedProduct.mockups && selectedProduct.mockups.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {selectedProduct.mockups.map((mockup, i) => (
                          <div key={mockup.id || i} className="aspect-square rounded-lg overflow-hidden bg-white/10 relative group">
                            <img src={mockup.image_url} alt={`Mockup ${i + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                              <a 
                                href={mockup.image_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-white/20 hover:bg-white/30"
                              >
                                <ExternalLink className="w-4 h-4 text-white" />
                              </a>
                              <button className="p-2 rounded-lg bg-white/20 hover:bg-white/30">
                                <Download className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="aspect-video rounded-lg bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center">
                        <Image className="w-8 h-8 text-white/20 mb-2" />
                        <p className="text-white/40 text-sm">No mockups generated yet</p>
                        <button
                          onClick={() => rerunMockups(selectedProduct)}
                          className="mt-3 px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium"
                        >
                          Generate Mockups
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 flex justify-between">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">
                  <Trash2 className="w-4 h-4" />
                  Delete Product
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowProductDetail(false)}
                    className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => rerunMockups(selectedProduct)}
                    className="px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600"
                  >
                    Re-run Mockups
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
