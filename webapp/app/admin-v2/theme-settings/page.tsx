'use client';

/**
 * Theme Settings Page
 * White-Label Configuration Dashboard
 * 
 * Allows white-label tenants to customize:
 * - Logo and branding
 * - Color palette
 * - Typography
 * - Footer text
 * - Custom CSS
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useBusiness } from '@/lib/business';
import CollapsibleSidebar from '../components/CollapsibleSidebar';
import TacticalHeader from '../components/TacticalHeader';
import { Upload, Palette, Type, Globe, Eye, Save, RefreshCw, Lock, Check, X } from 'lucide-react';

interface ThemeSettings {
  id?: string;
  business_id: string;
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  company_name: string | null;
  tagline: string | null;
  support_email: string | null;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  surface_color: string;
  text_primary: string;
  text_secondary: string;
  text_muted: string;
  border_color: string;
  success_color: string;
  warning_color: string;
  error_color: string;
  font_heading: string;
  font_body: string;
  footer_text: string | null;
  hide_powered_by: boolean;
  custom_css: string | null;
}

interface CustomDomain {
  id: string;
  domain: string;
  verification_status: 'pending' | 'verified' | 'failed';
  ssl_status: 'pending' | 'active' | 'expired' | 'failed';
  is_active: boolean;
  is_primary: boolean;
  cname_target: string;
  verification_token: string;
}

const defaultTheme: Omit<ThemeSettings, 'id' | 'business_id'> = {
  logo_url: null,
  logo_dark_url: null,
  favicon_url: null,
  company_name: null,
  tagline: null,
  support_email: null,
  primary_color: '#39FF14',
  secondary_color: '#0CE293',
  background_color: '#121212',
  surface_color: '#1A1A1A',
  text_primary: '#FFFFFF',
  text_secondary: '#A0AEC0',
  text_muted: '#718096',
  border_color: '#2D3748',
  success_color: '#10B981',
  warning_color: '#FFC800',
  error_color: '#FF3B3B',
  font_heading: 'Inter',
  font_body: 'Inter',
  footer_text: null,
  hide_powered_by: false,
  custom_css: null,
};

const fontOptions = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Playfair Display',
  'Merriweather',
  'Source Sans Pro',
  'Raleway',
];

export default function ThemeSettingsPage() {
  const router = useRouter();
  const { activeBusiness, isLoading: businessLoading } = useBusiness();
  
  const [theme, setTheme] = useState<ThemeSettings | null>(null);
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'branding' | 'colors' | 'typography' | 'domains' | 'advanced'>('branding');
  const [newDomain, setNewDomain] = useState('');
  const [isWhiteLabel, setIsWhiteLabel] = useState(false);
  
  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // File upload ref
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!businessLoading && activeBusiness) {
      loadThemeSettings();
      loadDomains();
      checkWhiteLabelStatus();
    }
  }, [activeBusiness, businessLoading]);

  const checkWhiteLabelStatus = async () => {
    if (!activeBusiness) return;
    
    const { data } = await supabase
      .from('businesses')
      .select('is_white_label, can_edit_site')
      .eq('id', activeBusiness.id)
      .single();
    
    setIsWhiteLabel(data?.is_white_label || false);
  };

  const loadThemeSettings = async () => {
    if (!activeBusiness) return;
    
    try {
      const { data, error } = await supabase
        .from('business_themes')
        .select('*')
        .eq('business_id', activeBusiness.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading theme:', error);
      }

      if (data) {
        setTheme(data as ThemeSettings);
      } else {
        // Create default theme for this business
        setTheme({
          ...defaultTheme,
          business_id: activeBusiness.id,
          company_name: activeBusiness.name,
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDomains = async () => {
    if (!activeBusiness) return;
    
    const { data } = await supabase
      .from('custom_domains')
      .select('*')
      .eq('business_id', activeBusiness.id)
      .order('is_primary', { ascending: false });

    if (data) {
      setDomains(data as CustomDomain[]);
    }
  };

  const handleThemeChange = (field: keyof ThemeSettings, value: any) => {
    setTheme(prev => prev ? { ...prev, [field]: value } : null);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!theme || !activeBusiness) return;
    
    setIsSaving(true);
    try {
      const themeData = {
        ...theme,
        business_id: activeBusiness.id,
        updated_at: new Date().toISOString(),
      };

      if (theme.id) {
        // Update existing
        const { error } = await supabase
          .from('business_themes')
          .update(themeData)
          .eq('id', theme.id);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('business_themes')
          .insert(themeData)
          .select()
          .single();

        if (error) throw error;
        setTheme(data as ThemeSettings);
      }

      setHasChanges(false);
      alert('Theme saved successfully!');
    } catch (error: any) {
      console.error('Save error:', error);
      alert(`Failed to save: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: 'logo_url' | 'logo_dark_url' | 'favicon_url') => {
    const file = event.target.files?.[0];
    if (!file || !activeBusiness) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${activeBusiness.id}/${field}_${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('business-assets')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('business-assets')
        .getPublicUrl(fileName);

      handleThemeChange(field, urlData.publicUrl);
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain || !activeBusiness) return;

    try {
      const { data, error } = await supabase
        .from('custom_domains')
        .insert({
          business_id: activeBusiness.id,
          domain: newDomain.toLowerCase().trim(),
          verification_token: `gl365-verify-${Math.random().toString(36).substring(7)}`,
          cname_target: 'app.greenline365.com',
        })
        .select()
        .single();

      if (error) throw error;

      setDomains(prev => [...prev, data as CustomDomain]);
      setNewDomain('');
    } catch (error: any) {
      alert(`Failed to add domain: ${error.message}`);
    }
  };

  const handleRemoveDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to remove this domain?')) return;

    const { error } = await supabase
      .from('custom_domains')
      .delete()
      .eq('id', domainId);

    if (!error) {
      setDomains(prev => prev.filter(d => d.id !== domainId));
    }
  };

  // Preview styles
  const previewStyles = theme ? {
    '--preview-primary': theme.primary_color,
    '--preview-secondary': theme.secondary_color,
    '--preview-bg': theme.background_color,
    '--preview-surface': theme.surface_color,
    '--preview-text': theme.text_primary,
    '--preview-text-muted': theme.text_muted,
  } as React.CSSProperties : {};

  if (isLoading || businessLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#39FF14] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isWhiteLabel) {
    return (
      <div className="min-h-screen bg-[#121212] flex">
        <CollapsibleSidebar
          activeItem="settings"
          onNewBooking={() => {}}
          onNewContent={() => {}}
          pendingCount={0}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isMobileOpen={mobileMenuOpen}
          onMobileToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-amber-500/20 flex items-center justify-center">
              <Lock className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">White-Label Feature</h2>
            <p className="text-white/60 mb-6">
              Theme customization is available for Elite White-Label subscribers ($1,200/mo).
              Upgrade to remove all GreenLine365 branding and customize your platform.
            </p>
            <button className="px-6 py-3 bg-gradient-to-r from-[#39FF14] to-[#0CE293] text-black font-bold rounded-xl">
              Upgrade to Elite
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--theme-bg-primary)' }}>
      <CollapsibleSidebar
        activeItem="settings"
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
          title="THEME SETTINGS"
          subtitle="WHITE-LABEL CUSTOMIZATION"
          onToday={() => {}}
          onPrev={() => {}}
          onNext={() => {}}
          viewMode="month"
          onViewChange={() => {}}
        />

        <main className="p-8">
          {/* Save Banner */}
          {hasChanges && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mb-6 p-4 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-between"
            >
              <span className="text-amber-400 font-medium">You have unsaved changes</span>
              <div className="flex gap-3">
                <button
                  onClick={() => loadThemeSettings()}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-[#39FF14] text-black font-bold hover:bg-[#39FF14]/90 transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Settings Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tabs */}
              <div className="flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
                {[
                  { id: 'branding', label: 'Branding', icon: Upload },
                  { id: 'colors', label: 'Colors', icon: Palette },
                  { id: 'typography', label: 'Typography', icon: Type },
                  { id: 'domains', label: 'Domains', icon: Globe },
                  { id: 'advanced', label: 'Advanced', icon: Eye },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition ${
                      activeTab === tab.id
                        ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                {/* Branding Tab */}
                {activeTab === 'branding' && theme && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-white mb-4">Brand Identity</h3>
                    
                    {/* Company Name */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Company Name</label>
                      <input
                        type="text"
                        value={theme.company_name || ''}
                        onChange={(e) => handleThemeChange('company_name', e.target.value)}
                        placeholder="Your Company Name"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-[#39FF14]/50 focus:outline-none"
                      />
                    </div>

                    {/* Tagline */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Tagline</label>
                      <input
                        type="text"
                        value={theme.tagline || ''}
                        onChange={(e) => handleThemeChange('tagline', e.target.value)}
                        placeholder="Your tagline"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-[#39FF14]/50 focus:outline-none"
                      />
                    </div>

                    {/* Logo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Logo</label>
                      <div className="flex items-center gap-4">
                        {theme.logo_url ? (
                          <div className="w-32 h-16 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                            <img src={theme.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-32 h-16 rounded-lg bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-white/30" />
                          </div>
                        )}
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleLogoUpload(e, 'logo_url')}
                          className="hidden"
                        />
                        <button
                          onClick={() => logoInputRef.current?.click()}
                          className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
                        >
                          Upload Logo
                        </button>
                      </div>
                      <p className="text-xs text-white/40 mt-2">Recommended: PNG or SVG, 200x50px minimum</p>
                    </div>

                    {/* Support Email */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Support Email</label>
                      <input
                        type="email"
                        value={theme.support_email || ''}
                        onChange={(e) => handleThemeChange('support_email', e.target.value)}
                        placeholder="support@yourcompany.com"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-[#39FF14]/50 focus:outline-none"
                      />
                    </div>

                    {/* Hide Powered By */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                      <div>
                        <p className="font-medium text-white">Hide "Powered by GreenLine365"</p>
                        <p className="text-sm text-white/50">Remove all platform branding from your site</p>
                      </div>
                      <button
                        onClick={() => handleThemeChange('hide_powered_by', !theme.hide_powered_by)}
                        className={`w-12 h-6 rounded-full transition ${
                          theme.hide_powered_by ? 'bg-[#39FF14]' : 'bg-white/20'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white transition transform ${
                          theme.hide_powered_by ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Colors Tab */}
                {activeTab === 'colors' && theme && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-white mb-4">Color Palette</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: 'primary_color', label: 'Primary' },
                        { key: 'secondary_color', label: 'Secondary' },
                        { key: 'background_color', label: 'Background' },
                        { key: 'surface_color', label: 'Surface' },
                        { key: 'text_primary', label: 'Text Primary' },
                        { key: 'text_secondary', label: 'Text Secondary' },
                        { key: 'text_muted', label: 'Text Muted' },
                        { key: 'border_color', label: 'Border' },
                        { key: 'success_color', label: 'Success' },
                        { key: 'warning_color', label: 'Warning' },
                        { key: 'error_color', label: 'Error' },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-3">
                          <input
                            type="color"
                            value={(theme as any)[key]}
                            onChange={(e) => handleThemeChange(key as keyof ThemeSettings, e.target.value)}
                            className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-2 border-white/20"
                          />
                          <div>
                            <p className="text-sm font-medium text-white">{label}</p>
                            <p className="text-xs text-white/50 font-mono">{(theme as any)[key]}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Typography Tab */}
                {activeTab === 'typography' && theme && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-white mb-4">Typography</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Heading Font</label>
                      <select
                        value={theme.font_heading}
                        onChange={(e) => handleThemeChange('font_heading', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#39FF14]/50 focus:outline-none"
                      >
                        {fontOptions.map(font => (
                          <option key={font} value={font} className="bg-[#1A1A1A]">{font}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Body Font</label>
                      <select
                        value={theme.font_body}
                        onChange={(e) => handleThemeChange('font_body', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#39FF14]/50 focus:outline-none"
                      >
                        {fontOptions.map(font => (
                          <option key={font} value={font} className="bg-[#1A1A1A]">{font}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Domains Tab */}
                {activeTab === 'domains' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-white mb-4">Custom Domains</h3>
                    
                    {/* Add Domain */}
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        placeholder="studio.yourdomain.com"
                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-[#39FF14]/50 focus:outline-none"
                      />
                      <button
                        onClick={handleAddDomain}
                        disabled={!newDomain}
                        className="px-6 py-3 rounded-xl bg-[#39FF14] text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Domain
                      </button>
                    </div>

                    {/* Domain List */}
                    <div className="space-y-3">
                      {domains.length === 0 ? (
                        <div className="p-8 text-center text-white/40">
                          <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No custom domains configured</p>
                        </div>
                      ) : (
                        domains.map(domain => (
                          <div
                            key={domain.id}
                            className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium text-white">{domain.domain}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  domain.verification_status === 'verified'
                                    ? 'bg-green-500/20 text-green-400'
                                    : domain.verification_status === 'failed'
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                  {domain.verification_status === 'verified' ? (
                                    <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Verified</span>
                                  ) : domain.verification_status === 'failed' ? (
                                    <span className="flex items-center gap-1"><X className="w-3 h-3" /> Failed</span>
                                  ) : (
                                    'Pending Verification'
                                  )}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  domain.ssl_status === 'active'
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                  SSL: {domain.ssl_status}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveDomain(domain.id)}
                              className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* DNS Instructions */}
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <h4 className="font-medium text-blue-400 mb-2">DNS Configuration</h4>
                      <p className="text-sm text-white/60 mb-3">
                        To connect your domain, add a CNAME record pointing to:
                      </p>
                      <code className="block p-3 rounded-lg bg-black/30 text-[#39FF14] font-mono text-sm">
                        app.greenline365.com
                      </code>
                    </div>
                  </div>
                )}

                {/* Advanced Tab */}
                {activeTab === 'advanced' && theme && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-white mb-4">Advanced Settings</h3>
                    
                    {/* Footer Text */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Custom Footer Text</label>
                      <input
                        type="text"
                        value={theme.footer_text || ''}
                        onChange={(e) => handleThemeChange('footer_text', e.target.value)}
                        placeholder="© 2025 Your Company. All rights reserved."
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-[#39FF14]/50 focus:outline-none"
                      />
                    </div>

                    {/* Custom CSS */}
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Custom CSS</label>
                      <textarea
                        value={theme.custom_css || ''}
                        onChange={(e) => handleThemeChange('custom_css', e.target.value)}
                        placeholder="/* Add custom CSS here */"
                        rows={10}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm placeholder:text-white/30 focus:border-[#39FF14]/50 focus:outline-none"
                      />
                      <p className="text-xs text-white/40 mt-2">⚠️ Use with caution. Invalid CSS may break your site.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Live Preview */}
            <div className="space-y-6">
              <div className="sticky top-8">
                <h3 className="text-lg font-bold text-white mb-4">Live Preview</h3>
                
                <div 
                  className="rounded-2xl overflow-hidden border border-white/10"
                  style={previewStyles}
                >
                  {/* Preview Header */}
                  <div 
                    className="p-4 flex items-center gap-3"
                    style={{ background: theme?.surface_color || '#1A1A1A' }}
                  >
                    {theme?.logo_url ? (
                      <img src={theme.logo_url} alt="Logo" className="h-8 w-auto" />
                    ) : (
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ background: `linear-gradient(135deg, ${theme?.primary_color}, ${theme?.secondary_color})` }}
                      >
                        {(theme?.company_name || 'G')[0]}
                      </div>
                    )}
                    <span style={{ color: theme?.text_primary }}>{theme?.company_name || 'Your Company'}</span>
                  </div>

                  {/* Preview Hero */}
                  <div 
                    className="p-6"
                    style={{ background: theme?.background_color || '#121212' }}
                  >
                    <h2 
                      className="text-xl font-bold mb-2"
                      style={{ color: theme?.text_primary, fontFamily: theme?.font_heading }}
                    >
                      {theme?.tagline || 'Your Tagline Here'}
                    </h2>
                    <p 
                      className="text-sm mb-4"
                      style={{ color: theme?.text_muted }}
                    >
                      Preview of your branded experience
                    </p>
                    <button
                      className="px-4 py-2 rounded-lg text-black font-medium text-sm"
                      style={{ background: theme?.primary_color }}
                    >
                      Get Started
                    </button>
                  </div>

                  {/* Preview Footer */}
                  <div 
                    className="p-4 text-center text-xs"
                    style={{ 
                      background: theme?.surface_color || '#1A1A1A',
                      color: theme?.text_muted,
                      borderTop: `1px solid ${theme?.border_color}`
                    }}
                  >
                    {theme?.footer_text || `© 2025 ${theme?.company_name || 'Your Company'}`}
                    {!theme?.hide_powered_by && (
                      <span className="block mt-1 opacity-50">Powered by GreenLine365</span>
                    )}
                  </div>
                </div>

                {/* Color Swatches */}
                <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-white/50 mb-3">Color Palette</p>
                  <div className="flex gap-2">
                    {[
                      theme?.primary_color,
                      theme?.secondary_color,
                      theme?.background_color,
                      theme?.surface_color,
                      theme?.success_color,
                      theme?.warning_color,
                    ].map((color, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-lg border border-white/20"
                        style={{ background: color }}
                        title={color || ''}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
