'use client';

/**
 * Property Passport - "Carfax for Homes"
 * The heart of the Property-First system.
 * Shows property history, health score, timeline, warranty vault, and assets.
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useBusiness } from '@/lib/business';
import CollapsibleSidebar from '../components/CollapsibleSidebar';

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  full_address: string;
  gate_code?: string;
  created_at: string;
  contacts: Contact[];
  assets: Asset[];
  interactions: Interaction[];
  health_score: number;
  total_maintenance_value: number;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  phone_normalized: string;
  role: string;
  relationship_score: number;
}

interface Asset {
  id: string;
  asset_type: string;
  brand?: string;
  model?: string;
  install_date?: string;
  confidence_score: number;
  metadata: Record<string, any>;
}

interface Interaction {
  id: string;
  type: string;
  summary: string;
  sentiment_score: number;
  created_at: string;
  contact_id?: string;
  metadata?: Record<string, any>;
}

// Health score color
function getHealthColor(score: number) {
  if (score >= 70) return '#39FF14';
  if (score >= 40) return '#FFB800';
  return '#FF4444';
}

function getHealthLabel(score: number) {
  if (score >= 70) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Attention';
}

// Asset type icons map
const assetIcons: Record<string, string> = {
  hvac: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  plumbing: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  roofing: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  electrical: 'M13 10V3L4 14h7v7l9-11h-7z',
  water_heater: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
  security: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
};

const stagger = { animate: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function PropertyPassportPage() {
  const { activeBusiness } = useBusiness();
  const searchParams = useSearchParams();
  const selectedPropertyId = searchParams.get('id');

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'assets' | 'warranty' | 'contacts'>('timeline');

  // Load properties list
  useEffect(() => {
    if (!activeBusiness?.id) return;
    loadProperties();
  }, [activeBusiness?.id]);

  // Load selected property
  useEffect(() => {
    if (selectedPropertyId && activeBusiness?.id) {
      loadPropertyDetail(selectedPropertyId);
    }
  }, [selectedPropertyId, activeBusiness?.id]);

  async function loadProperties() {
    if (!activeBusiness?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('properties')
      .select('id, address, city, state, zip, full_address, created_at, contacts(id, first_name, last_name), assets(id, asset_type)')
      .eq('tenant_id', activeBusiness.id)
      .order('created_at', { ascending: false });
    setProperties(data || []);
    setLoading(false);
  }

  async function loadPropertyDetail(id: string) {
    if (!activeBusiness?.id) return;
    setDetailLoading(true);

    const [propRes, contactsRes, assetsRes, interactionsRes] = await Promise.all([
      supabase.from('properties').select('*').eq('id', id).eq('tenant_id', activeBusiness.id).single(),
      supabase.from('contacts').select('*').eq('property_id', id).eq('tenant_id', activeBusiness.id),
      supabase.from('assets').select('*').eq('property_id', id).eq('tenant_id', activeBusiness.id),
      supabase.from('interactions').select('*').eq('property_id', id).eq('tenant_id', activeBusiness.id).order('created_at', { ascending: false }).limit(50),
    ]);

    if (propRes.data) {
      const assets = assetsRes.data || [];
      let healthScore = 100;
      for (const asset of assets) {
        if (asset.install_date) {
          const ageYears = (Date.now() - new Date(asset.install_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
          if (ageYears > 15) healthScore -= 20;
          else if (ageYears > 10) healthScore -= 10;
          else if (ageYears > 5) healthScore -= 5;
        }
        if (asset.confidence_score && asset.confidence_score < 50) healthScore -= 10;
      }
      healthScore = Math.max(0, Math.min(100, healthScore));

      setSelectedProperty({
        ...propRes.data,
        contacts: contactsRes.data || [],
        assets,
        interactions: interactionsRes.data || [],
        health_score: healthScore,
        total_maintenance_value: 0,
      });
    }
    setDetailLoading(false);
  }

  const filteredProperties = useMemo(() => {
    if (!searchQuery) return properties;
    const q = searchQuery.toLowerCase();
    return properties.filter((p: any) =>
      (p.full_address || p.address || '').toLowerCase().includes(q) ||
      (p.contacts || []).some((c: any) => `${c.first_name} ${c.last_name}`.toLowerCase().includes(q))
    );
  }, [properties, searchQuery]);

  // Render property detail view
  if (selectedProperty) {
    const healthColor = getHealthColor(selectedProperty.health_score);
    const healthLabel = getHealthLabel(selectedProperty.health_score);

    return (
      <div className="min-h-screen flex relative" style={{ background: '#0A0A0A' }}>
        <CollapsibleSidebar
          activeItem="property-passport"
          onNewBooking={() => {}} onNewContent={() => {}} pendingCount={0}
          isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isMobileOpen={mobileMenuOpen} onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <div className="flex-1 min-w-0 relative z-10 p-6 lg:p-8">
          {/* Back button */}
          <button
            onClick={() => setSelectedProperty(null)}
            className="flex items-center gap-2 text-zinc-500 hover:text-white text-sm mb-6 transition"
            data-testid="back-to-properties"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Properties
          </button>

          {detailLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-zinc-700 border-t-green-400 rounded-full animate-spin" />
            </div>
          ) : (
            <motion.div variants={stagger} initial="initial" animate="animate">
              {/* Property At-A-Glance Header */}
              <motion.div variants={fadeUp} className="backdrop-blur-xl rounded-2xl border p-6 lg:p-8 mb-6" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white" data-testid="property-address">
                      {selectedProperty.full_address || selectedProperty.address}
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">
                      {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip}
                      {selectedProperty.gate_code && <span className="ml-3 text-zinc-600">Gate: {selectedProperty.gate_code}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    {/* Health Score */}
                    <div className="text-center" data-testid="health-score">
                      <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                          <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                          <path
                            d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none" stroke={healthColor} strokeWidth="3"
                            strokeDasharray={`${selectedProperty.health_score}, 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold" style={{ color: healthColor }}>
                          {selectedProperty.health_score}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1">{healthLabel}</p>
                    </div>
                    {/* Maintenance Value */}
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">${selectedProperty.total_maintenance_value.toLocaleString()}</p>
                      <p className="text-[10px] text-zinc-500">Total Invested</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Tabs */}
              <motion.div variants={fadeUp} className="flex gap-1 mb-6 bg-zinc-900/50 rounded-xl p-1 w-fit">
                {(['timeline', 'assets', 'warranty', 'contacts'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    style={activeTab === tab ? { background: 'rgba(57,255,20,0.1)', color: '#39FF14' } : {}}
                    data-testid={`tab-${tab}`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </motion.div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'timeline' && (
                  <motion.div key="timeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <TimelineView interactions={selectedProperty.interactions} assets={selectedProperty.assets} />
                  </motion.div>
                )}
                {activeTab === 'assets' && (
                  <motion.div key="assets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <AssetsView assets={selectedProperty.assets} />
                  </motion.div>
                )}
                {activeTab === 'warranty' && (
                  <motion.div key="warranty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <WarrantyVault assets={selectedProperty.assets} />
                  </motion.div>
                )}
                {activeTab === 'contacts' && (
                  <motion.div key="contacts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ContactsView contacts={selectedProperty.contacts} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // Render properties list view
  return (
    <div className="min-h-screen flex relative" style={{ background: '#0A0A0A' }}>
      <CollapsibleSidebar
        activeItem="property-passport"
        onNewBooking={() => {}} onNewContent={() => {}} pendingCount={0}
        isCollapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileMenuOpen} onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />
      <div className="flex-1 min-w-0 relative z-10 p-6 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white" data-testid="passport-title">Property Passports</h1>
            <p className="text-sm text-zinc-500 mt-1">Every address tells a story</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by address or contact name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/30"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}
              data-testid="property-search"
            />
          </div>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto mb-4 text-zinc-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <h3 className="text-lg font-medium text-zinc-400 mb-2">
              {searchQuery ? 'No properties match your search' : 'No properties yet'}
            </h3>
            <p className="text-sm text-zinc-600">
              {searchQuery ? 'Try a different search term' : 'Properties are created when calls come in through the AI agent'}
            </p>
          </div>
        ) : (
          <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProperties.map((prop: any) => (
              <motion.div
                key={prop.id}
                variants={fadeUp}
                onClick={() => loadPropertyDetail(prop.id)}
                className="backdrop-blur-xl rounded-2xl border p-5 cursor-pointer transition hover:border-green-500/20 hover:bg-white/[0.02] group"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
                data-testid={`property-card-${prop.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(57,255,20,0.08)' }}>
                    <svg className="w-5 h-5" style={{ color: '#39FF14' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <svg className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-white truncate mb-1">{prop.full_address || prop.address}</h3>
                <p className="text-xs text-zinc-500 mb-3">{prop.city}, {prop.state} {prop.zip}</p>
                <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                  <span>{prop.contacts?.length || 0} contacts</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span>{prop.assets?.length || 0} assets</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function TimelineView({ interactions, assets }: { interactions: Interaction[]; assets: Asset[] }) {
  // Combine interactions and assets into a unified timeline
  const timeline = useMemo(() => {
    const items: { date: string; type: string; title: string; description: string; sentiment?: number; icon: string; color: string }[] = [];

    for (const int of interactions) {
      items.push({
        date: int.created_at,
        type: int.type || 'interaction',
        title: int.type || 'Service Call',
        description: int.summary || 'No summary available',
        sentiment: int.sentiment_score,
        icon: 'phone',
        color: int.sentiment_score > 0.5 ? '#39FF14' : int.sentiment_score > 0 ? '#FFB800' : '#FF4444',
      });
    }

    for (const asset of assets) {
      if (asset.install_date) {
        items.push({
          date: asset.install_date,
          type: 'installation',
          title: `${asset.asset_type} Installed`,
          description: `${asset.brand || 'Unknown'} ${asset.model || ''} - Confidence: ${asset.confidence_score || 0}%`,
          icon: 'wrench',
          color: '#00D4FF',
        });
      }
    }

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [interactions, assets]);

  if (timeline.length === 0) {
    return (
      <div className="backdrop-blur-xl rounded-2xl border p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <svg className="w-12 h-12 mx-auto mb-3 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-zinc-500 text-sm">No history recorded yet</p>
        <p className="text-zinc-600 text-xs mt-1">Events will appear here as the property builds its passport</p>
      </div>
    );
  }

  return (
    <div className="relative pl-8">
      {/* Timeline line */}
      <div className="absolute left-3 top-0 bottom-0 w-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

      <div className="space-y-4">
        {timeline.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative"
            data-testid={`timeline-item-${i}`}
          >
            {/* Dot */}
            <div className="absolute -left-5 top-3 w-3 h-3 rounded-full border-2" style={{ borderColor: item.color, background: '#0A0A0A' }} />

            <div className="backdrop-blur-xl rounded-xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: item.color }}>{item.title}</span>
                <span className="text-[10px] text-zinc-600">
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
              <p className="text-sm text-zinc-400">{item.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AssetsView({ assets }: { assets: Asset[] }) {
  if (assets.length === 0) {
    return (
      <div className="backdrop-blur-xl rounded-2xl border p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="text-zinc-500 text-sm">No assets tracked for this property</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {assets.map((asset) => {
        const ageYears = asset.install_date
          ? Math.floor((Date.now() - new Date(asset.install_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : null;
        const iconPath = assetIcons[asset.asset_type?.toLowerCase()] || assetIcons.hvac;

        return (
          <div
            key={asset.id}
            className="backdrop-blur-xl rounded-2xl border p-5"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
            data-testid={`asset-${asset.id}`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,212,255,0.1)' }}>
                <svg className="w-6 h-6" style={{ color: '#00D4FF' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-white capitalize">{asset.asset_type?.replace('_', ' ')}</h4>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {asset.brand && <span>{asset.brand}</span>}
                  {asset.model && <span> {asset.model}</span>}
                </p>
                <div className="flex items-center gap-4 mt-3 text-[10px]">
                  {ageYears !== null && (
                    <span className={ageYears > 10 ? 'text-red-400' : ageYears > 5 ? 'text-yellow-400' : 'text-green-400'}>
                      {ageYears} years old
                    </span>
                  )}
                  <span className="text-zinc-600">Confidence: {asset.confidence_score || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WarrantyVault({ assets }: { assets: Asset[] }) {
  const assetTypes = ['HVAC', 'Plumbing', 'Roofing', 'Electrical', 'Water Heater', 'Security'];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {assetTypes.map((type) => {
        const asset = assets.find(a => a.asset_type?.toLowerCase() === type.toLowerCase().replace(' ', '_'));
        const hasData = !!asset;
        const iconPath = assetIcons[type.toLowerCase().replace(' ', '_')] || assetIcons.hvac;

        return (
          <div
            key={type}
            className={`backdrop-blur-xl rounded-2xl border p-5 text-center transition ${hasData ? 'cursor-pointer hover:border-cyan-500/20' : 'opacity-40'}`}
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: hasData ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)' }}
            data-testid={`warranty-${type.toLowerCase().replace(' ', '-')}`}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: hasData ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)' }}>
              <svg className="w-7 h-7" style={{ color: hasData ? '#00D4FF' : '#333' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
              </svg>
            </div>
            <h4 className="text-sm font-medium text-white mb-1">{type}</h4>
            {hasData ? (
              <p className="text-[10px] text-zinc-500">
                {asset.brand || 'Unknown'} - {asset.install_date ? new Date(asset.install_date).getFullYear() : 'N/A'}
              </p>
            ) : (
              <p className="text-[10px] text-zinc-700">No data</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ContactsView({ contacts }: { contacts: Contact[] }) {
  if (contacts.length === 0) {
    return (
      <div className="backdrop-blur-xl rounded-2xl border p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="text-zinc-500 text-sm">No contacts linked to this property</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {contacts.map((contact) => {
        const crsColor = contact.relationship_score > 70 ? '#39FF14' : contact.relationship_score > 30 ? '#FFB800' : '#FF4444';
        return (
          <div
            key={contact.id}
            className="backdrop-blur-xl rounded-xl border p-4 flex items-center gap-4"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
            data-testid={`contact-${contact.id}`}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)' }}>
              <span className="text-sm font-bold text-purple-400">
                {(contact.first_name?.[0] || '') + (contact.last_name?.[0] || '')}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{contact.first_name} {contact.last_name}</p>
              <p className="text-xs text-zinc-500">{contact.phone_normalized || 'No phone'} - {contact.role || 'Contact'}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: crsColor }}>{contact.relationship_score || 0}</p>
              <p className="text-[10px] text-zinc-600">CRS</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
