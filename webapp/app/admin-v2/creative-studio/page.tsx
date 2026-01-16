'use client';

/**
 * ArtfulPhusion Creative Studio
 * 
 * The flagship AI-powered product photography and mockup generation system.
 * 
 * Features:
 * - Product Upload & AI Analysis (Gemini 3 Pro)
 * - Character Vault (Signature Models)
 * - 6-Pack Mockup Generator (Nano Banana Pro)
 * - Product Library with persistence
 * - Omnichannel Export (Pinterest/TikTok)
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useBusiness } from '@/lib/business';
import CollapsibleSidebar from '../components/CollapsibleSidebar';
import TacticalHeader from '../components/TacticalHeader';
import { 
  Upload, 
  Sparkles, 
  Users, 
  Image, 
  Download, 
  Share2, 
  Folder,
  Plus,
  Camera,
  Wand2,
  Eye,
  ChevronRight
} from 'lucide-react';

// Product types supported
const PRODUCT_TYPES = [
  { id: 'apparel', label: 'Apparel', icon: '👕', description: 'Clothing & fashion items' },
  { id: 'wall_art', label: 'Wall Art', icon: '🖼️', description: 'Prints, canvases, posters' },
  { id: 'accessories', label: 'Accessories', icon: '👜', description: 'Bags, watches, jewelry' },
  { id: 'jewelry', label: 'Jewelry', icon: '💎', description: 'Rings, necklaces, earrings' },
  { id: 'home_decor', label: 'Home Decor', icon: '🏠', description: 'Furniture, pillows, vases' },
  { id: 'packaging', label: 'Packaging', icon: '📦', description: 'Boxes, bottles, containers' },
  { id: 'footwear', label: 'Footwear', icon: '👟', description: 'Shoes, boots, sneakers' },
  { id: 'default', label: 'Other', icon: '📸', description: 'General products' },
];

export default function CreativeStudioPage() {
  const router = useRouter();
  const { activeBusiness, hasFeature } = useBusiness();
  
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

  // State
  const [activeTab, setActiveTab] = useState<'upload' | 'vault' | 'library'>('upload');
  const [selectedProductType, setSelectedProductType] = useState<string | null>(null);
  
  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Feature gate check
  if (!hasFeature('mockup_generator')) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-purple-500/20 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-purple-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Creative Studio</h2>
          <p className="text-white/60 mb-6">
            Upgrade to Professional or higher to access the AI-powered Creative Studio 
            with mockup generation and product analysis.
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-[#39FF14] to-[#0CE293] text-black font-bold rounded-xl">
            Upgrade Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--theme-bg-primary, #121212)' }}>
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

        <main className="p-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            {[
              { id: 'upload', label: 'Create New', icon: Plus },
              { id: 'vault', label: 'Character Vault', icon: Users },
              { id: 'library', label: 'Product Library', icon: Folder },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Create New Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-8">
              {/* Step 1: Select Product Type */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#39FF14]/20 flex items-center justify-center">
                    <span className="text-[#39FF14] font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Select Product Type</h3>
                    <p className="text-sm text-white/50">This helps our AI optimize lighting and scene selection</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PRODUCT_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedProductType(type.id)}
                      className={`p-4 rounded-xl text-left transition ${
                        selectedProductType === type.id
                          ? 'bg-[#39FF14]/20 border-2 border-[#39FF14]'
                          : 'bg-white/5 border border-white/10 hover:border-white/30'
                      }`}
                    >
                      <span className="text-2xl mb-2 block">{type.icon}</span>
                      <p className="font-medium text-white">{type.label}</p>
                      <p className="text-xs text-white/50">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Upload Product Photos */}
              <div className={`p-6 rounded-2xl border transition ${
                selectedProductType 
                  ? 'bg-white/5 border-white/10' 
                  : 'bg-white/2 border-white/5 opacity-50 pointer-events-none'
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedProductType ? 'bg-[#39FF14]/20' : 'bg-white/10'
                  }`}>
                    <span className={selectedProductType ? 'text-[#39FF14] font-bold' : 'text-white/30 font-bold'}>2</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Upload Product Photos</h3>
                    <p className="text-sm text-white/50">Upload 1-5 photos from different angles</p>
                  </div>
                </div>

                <div className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-[#39FF14]/50 transition cursor-pointer">
                  <Upload className="w-12 h-12 text-white/30 mx-auto mb-4" />
                  <p className="text-white/60 mb-2">Drag and drop your product photos here</p>
                  <p className="text-white/40 text-sm mb-4">or click to browse</p>
                  <button className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition">
                    Select Files
                  </button>
                </div>
              </div>

              {/* Step 3: AI Analysis (placeholder) */}
              <div className="p-6 rounded-2xl bg-white/2 border border-white/5 opacity-50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <span className="text-white/30 font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white/50">AI Analysis</h3>
                    <p className="text-sm text-white/30">Gemini 3 Pro will analyze your product</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                  <Wand2 className="w-8 h-8 text-purple-400/50" />
                  <div>
                    <p className="text-white/50">AI will extract:</p>
                    <p className="text-sm text-white/30">Description • Materials • Price suggestions • Marketing angles</p>
                  </div>
                </div>
              </div>

              {/* Step 4: Generate Mockups (placeholder) */}
              <div className="p-6 rounded-2xl bg-white/2 border border-white/5 opacity-50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <span className="text-white/30 font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white/50">Generate 6-Pack Mockups</h3>
                    <p className="text-sm text-white/30">Select scenes and models for cinematic product shots</p>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-3">
                  {['Macro', 'Lifestyle', 'Action', 'Studio', 'Golden Hour', 'Flat Lay'].map((scene, i) => (
                    <div key={scene} className="aspect-square rounded-lg bg-white/5 flex items-center justify-center">
                      <span className="text-white/20 text-xs">{scene}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Character Vault Tab */}
          {activeTab === 'vault' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Signature Models</h2>
                  <p className="text-white/50">Create consistent AI-generated models for your brand</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#39FF14] text-black font-bold rounded-xl">
                  <Plus className="w-5 h-5" />
                  Create New Model
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Placeholder cards */}
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 border-dashed text-center">
                  <div className="w-20 h-20 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-8 h-8 text-white/20" />
                  </div>
                  <p className="text-white/40 mb-2">No models created yet</p>
                  <p className="text-xs text-white/30">Create your first Signature Model to maintain brand consistency</p>
                </div>
              </div>

              {/* Model Creation Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
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
                    The AI will learn their features for consistent mockups.
                  </p>
                  <button className="w-full py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition">
                    Upload Reference Photos
                  </button>
                </div>

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
                    Define your ideal model using parameters: ethnicity, age range, 
                    and style. Perfect for brands without access to real models.
                  </p>
                  <button className="w-full py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition">
                    Generate Virtual Model
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Product Library Tab */}
          {activeTab === 'library' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Product Library</h2>
                  <p className="text-white/50">Your saved products and generated mockups</p>
                </div>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition">
                    <Download className="w-5 h-5" />
                    Export All
                  </button>
                </div>
              </div>

              {/* Empty state */}
              <div className="p-12 rounded-2xl bg-white/5 border border-white/10 text-center">
                <Folder className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No products yet</h3>
                <p className="text-white/50 mb-6 max-w-md mx-auto">
                  Start by uploading your first product. All your creations will be saved here 
                  so you can regenerate mockups with different models or scenes.
                </p>
                <button 
                  onClick={() => setActiveTab('upload')}
                  className="px-6 py-3 bg-[#39FF14] text-black font-bold rounded-xl"
                >
                  Create Your First Product
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
