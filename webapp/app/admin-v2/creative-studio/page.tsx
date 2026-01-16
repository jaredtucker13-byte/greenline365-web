'use client';

/**
 * ArtfulPhusion Creative Studio
 * Full Implementation with AI Analysis & Mockup Generation
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
  RefreshCw, Trash2, Star, Grid, List, ArrowRight
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

interface Product {
  id: string;
  name: string;
  description: string;
  product_type: string;
  original_images: string[];
  ai_analysis: any;
  status: string;
  created_at: string;
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

interface Scene {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  preview_url: string | null;
}

export default function CreativeStudioPage() {
  const router = useRouter();
  const { activeBusiness, hasFeature } = useBusiness();
  const { requestConfirmation } = useCostTracking();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  
  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [signatureModels, setSignatureModels] = useState<SignatureModel[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedScenes, setSelectedScenes] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  
  // Mockup generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMockups, setGeneratedMockups] = useState<string[]>([]);
  
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
      loadScenes();
    }
  }, [activeBusiness]);

  const loadProducts = async () => {
    if (!activeBusiness) return;
    const { data } = await supabase
      .from('studio_products')
      .select('*')
      .eq('business_id', activeBusiness.id)
      .order('created_at', { ascending: false });
    if (data) setProducts(data);
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

  const loadScenes = async () => {
    const { data } = await supabase
      .from('mockup_scenes')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    if (data) setScenes(data);
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

  // Upload files to Supabase Storage
  const uploadFiles = async (): Promise<string[]> => {
    if (!activeBusiness || uploadedFiles.length === 0) return [];
    
    setIsUploading(true);
    const urls: string[] = [];
    
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
    if (uploadedFiles.length === 0 || !selectedProductType) return;
    
    // Request cost confirmation
    requestConfirmation(
      '/api/studio/analyze-product',
      1, // 1 analysis call
      async () => {
        setIsAnalyzing(true);
        
        try {
          // First upload files
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
      { productType: selectedProductType, imageCount: uploadedFiles.length }
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
          description: analysisResult.description || '',
          product_type: selectedProductType,
          original_images: uploadedUrls,
          ai_analysis: analysisResult,
          status: 'analyzed',
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setProducts(prev => [data, ...prev]);
      setStep(4);
      
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save product');
    }
  };

  // Generate mockups (with cost confirmation)
  const generateMockups = async () => {
    if (selectedScenes.length === 0) return;
    
    // Request cost confirmation - shows modal for platform owner, logs for tenants
    requestConfirmation(
      '/api/studio/generate-mockups',
      selectedScenes.length, // Each scene = 1 image
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
          setGeneratedMockups(result.mockups || []);
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

              {/* Step 2: Upload Photos */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">Upload Product Photos</h3>
                      <p className="text-white/50">Add 1-5 photos from different angles</p>
                    </div>
                    <button onClick={() => setStep(1)} className="text-white/40 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {uploadedFiles.length === 0 ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleFileDrop}
                      onDragOver={(e) => e.preventDefault()}
                      className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-purple-500/50 transition cursor-pointer"
                    >
                      <Upload className="w-12 h-12 text-white/30 mx-auto mb-4" />
                      <p className="text-white/60 mb-2">Drag and drop your product photos</p>
                      <p className="text-white/40 text-sm">PNG, JPG up to 10MB each</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-5 gap-3">
                        {uploadedFiles.map((file, i) => (
                          <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-white/10">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Upload ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => removeFile(i)}
                              className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {uploadedFiles.length < 5 && (
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center hover:border-purple-500/50"
                          >
                            <Plus className="w-6 h-6 text-white/40" />
                          </button>
                        )}
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={() => { setUploadedFiles([]); }}
                          className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
                        >
                          Clear All
                        </button>
                        <button
                          onClick={analyzeProduct}
                          disabled={isUploading || isAnalyzing}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold disabled:opacity-50"
                        >
                          {isUploading || isAnalyzing ? (
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

                      {analysisResult.suggested_price && (
                        <div>
                          <label className="block text-sm font-medium text-white/70 mb-1">Suggested Price</label>
                          <p className="text-white font-medium">
                            ${analysisResult.suggested_price.min} - ${analysisResult.suggested_price.max}
                          </p>
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

              {/* Step 4: Select Scenes & Model */}
              {step === 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Scene Selection */}
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-2">Select Scenes (6-Pack)</h3>
                    <p className="text-white/50 mb-4">Choose up to 6 scenes for your mockups</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {scenes.map(scene => (
                        <button
                          key={scene.id}
                          onClick={() => {
                            if (selectedScenes.includes(scene.slug)) {
                              setSelectedScenes(prev => prev.filter(s => s !== scene.slug));
                            } else if (selectedScenes.length < 6) {
                              setSelectedScenes(prev => [...prev, scene.slug]);
                            }
                          }}
                          className={`p-4 rounded-xl text-left transition ${
                            selectedScenes.includes(scene.slug)
                              ? 'bg-purple-500/20 border-2 border-purple-500'
                              : 'bg-white/5 border border-white/10 hover:border-purple-500/50'
                          }`}
                        >
                          <div className="aspect-video rounded-lg bg-white/10 mb-2 flex items-center justify-center">
                            <Camera className="w-6 h-6 text-white/30" />
                          </div>
                          <p className="font-medium text-white text-sm">{scene.name}</p>
                          <p className="text-xs text-white/50">{scene.description}</p>
                        </button>
                      ))}
                    </div>
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

              {/* Step 5: Results */}
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
                      generatedMockups.map((url, i) => (
                        <div key={i} className="relative group rounded-xl overflow-hidden bg-white/10">
                          <img src={url} alt={`Mockup ${i + 1}`} className="w-full aspect-square object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
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
                      // Placeholder if no mockups yet
                      Array(6).fill(0).map((_, i) => (
                        <div key={i} className="aspect-square rounded-xl bg-white/5 flex items-center justify-center">
                          <Image className="w-8 h-8 text-white/20" />
                        </div>
                      ))
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

          {/* === PRODUCT LIBRARY TAB === */}
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
                    <div key={product.id} className="rounded-xl bg-white/5 border border-white/10 overflow-hidden group">
                      <div className="aspect-square bg-white/10 relative">
                        {product.original_images?.[0] && (
                          <img src={product.original_images[0]} alt={product.name} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <button className="p-2 rounded-lg bg-white/20 hover:bg-white/30">
                            <RefreshCw className="w-5 h-5 text-white" />
                          </button>
                          <button className="p-2 rounded-lg bg-white/20 hover:bg-white/30">
                            <Trash2 className="w-5 h-5 text-white" />
                          </button>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-white truncate">{product.name}</p>
                        <p className="text-xs text-white/50">{product.product_type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
