'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Upload, FileImage, AlertTriangle, CheckCircle, XCircle, 
  Send, Eye, Clock, Trash2, Plus, Loader2, Zap, FileText,
  Camera, Shield, Mail, Download
} from 'lucide-react';

interface Incident {
  id: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  property_address: string;
  ai_analysis: any;
  report_sections: any;
  signature_token: string;
  signed_at: string | null;
  signature_type: string | null;
  email_sent_at: string | null;
  created_at: string;
  incident_images?: IncidentImage[];
}

interface IncidentImage {
  id: string;
  filename: string;
  url: string;
  caption: string;
  ai_analysis: any;
}

const severityColors: Record<string, string> = {
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  critical: 'bg-red-500/20 text-red-400 border-red-500/30'
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  pending_review: 'bg-blue-500/20 text-blue-400',
  pending_signature: 'bg-purple-500/20 text-purple-400',
  signed: 'bg-green-500/20 text-green-400',
  refused: 'bg-red-500/20 text-red-400',
  archived: 'bg-gray-500/20 text-gray-500'
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    property_address: '',
    severity: 'medium'
  });

  const supabase = createClientComponentClient();

  const fetchIncidents = useCallback(async () => {
    try {
      const res = await fetch('/api/incidents');
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const createIncident = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIncident)
      });
      if (res.ok) {
        const incident = await res.json();
        setIncidents([incident, ...incidents]);
        setSelectedIncident(incident);
        setShowNewForm(false);
        setNewIncident({
          title: '',
          description: '',
          customer_name: '',
          customer_email: '',
          customer_phone: '',
          property_address: '',
          severity: 'medium'
        });
      }
    } catch (error) {
      console.error('Error creating incident:', error);
    } finally {
      setCreating(false);
    }
  };

  const loadIncidentDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/incidents?id=${id}`);
      if (res.ok) {
        const incident = await res.json();
        setSelectedIncident(incident);
      }
    } catch (error) {
      console.error('Error loading incident:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedIncident) return;
    
    setUploadingImages(true);
    const formData = new FormData();
    formData.append('incident_id', selectedIncident.id);
    
    for (const file of Array.from(e.target.files)) {
      formData.append('files', file);
    }

    try {
      const res = await fetch('/api/incidents/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        await loadIncidentDetails(selectedIncident.id);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setUploadingImages(false);
    }
  };

  const analyzeImage = async (imageId: string, imageUrl: string) => {
    if (!selectedIncident) return;
    
    setAnalyzing(true);
    try {
      const res = await fetch('/api/incidents/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: selectedIncident.id,
          image_url: imageUrl
        })
      });
      
      if (res.ok) {
        const { analysis } = await res.json();
        
        // Update image with analysis
        await supabase
          .from('incident_images')
          .update({ 
            ai_analysis: analysis,
            caption: analysis.suggested_caption 
          })
          .eq('id', imageId);
        
        await loadIncidentDetails(selectedIncident.id);
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzeAllImages = async () => {
    if (!selectedIncident?.incident_images) return;
    
    setAnalyzing(true);
    for (const image of selectedIncident.incident_images) {
      if (!image.ai_analysis || Object.keys(image.ai_analysis).length === 0) {
        await analyzeImage(image.id, image.url);
      }
    }
    setAnalyzing(false);
  };

  const generateReport = async () => {
    if (!selectedIncident) return;
    
    setGenerating(true);
    try {
      const res = await fetch('/api/incidents/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident_id: selectedIncident.id })
      });
      
      if (res.ok) {
        await loadIncidentDetails(selectedIncident.id);
        await fetchIncidents();
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const sendForSignature = async () => {
    if (!selectedIncident) return;
    
    setSending(true);
    try {
      const res = await fetch('/api/incidents/send-for-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident_id: selectedIncident.id })
      });
      
      if (res.ok) {
        const result = await res.json();
        alert(`Email sent! Signing link: ${result.sign_link}`);
        await loadIncidentDetails(selectedIncident.id);
        await fetchIncidents();
      }
    } catch (error) {
      console.error('Error sending for signature:', error);
    } finally {
      setSending(false);
    }
  };

  const deleteIncident = async (id: string) => {
    if (!confirm('Are you sure you want to delete this incident?')) return;
    
    try {
      const res = await fetch(`/api/incidents?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setIncidents(incidents.filter(i => i.id !== id));
        if (selectedIncident?.id === id) {
          setSelectedIncident(null);
        }
      }
    } catch (error) {
      console.error('Error deleting incident:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="text-emerald-400" />
              Liability Documentation
            </h1>
            <p className="text-gray-400 mt-1">
              Document incidents, analyze damage, and capture signatures
            </p>
          </div>
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
          >
            <Plus size={20} />
            New Incident
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Incidents List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Recent Incidents</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="animate-spin mx-auto mb-2" />
                <p className="text-gray-400">Loading...</p>
              </div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-8 bg-white/5 rounded-lg border border-white/10">
                <FileText className="mx-auto mb-2 text-gray-500" size={40} />
                <p className="text-gray-400">No incidents yet</p>
                <button
                  onClick={() => setShowNewForm(true)}
                  className="mt-4 text-emerald-400 hover:text-emerald-300"
                >
                  Create your first incident report
                </button>
              </div>
            ) : (
              incidents.map(incident => (
                <div
                  key={incident.id}
                  onClick={() => loadIncidentDetails(incident.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedIncident?.id === incident.id
                      ? 'bg-emerald-500/10 border-emerald-500/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold truncate flex-1">{incident.title}</h3>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteIncident(incident.id); }}
                      className="text-gray-500 hover:text-red-400 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="flex gap-2 mb-2">
                    <span className={`text-xs px-2 py-1 rounded ${statusColors[incident.status] || statusColors.draft}`}>
                      {incident.status.replace('_', ' ')}
                    </span>
                    {incident.severity && (
                      <span className={`text-xs px-2 py-1 rounded border ${severityColors[incident.severity]}`}>
                        {incident.severity}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-400 truncate">
                    {incident.customer_name || 'No customer'} • {incident.property_address || 'No address'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(incident.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Incident Detail */}
          <div className="lg:col-span-2">
            {showNewForm ? (
              <div className="bg-white/5 rounded-lg border border-white/10 p-6">
                <h2 className="text-xl font-semibold mb-6">Create New Incident</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm text-gray-400 mb-1">Title *</label>
                    <input
                      type="text"
                      value={newIncident.title}
                      onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                      placeholder="e.g., Water Damage Assessment - 123 Main St"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Customer Name</label>
                    <input
                      type="text"
                      value={newIncident.customer_name}
                      onChange={(e) => setNewIncident({ ...newIncident, customer_name: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Customer Email *</label>
                    <input
                      type="email"
                      value={newIncident.customer_email}
                      onChange={(e) => setNewIncident({ ...newIncident, customer_email: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={newIncident.customer_phone}
                      onChange={(e) => setNewIncident({ ...newIncident, customer_phone: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Severity</label>
                    <select
                      value={newIncident.severity}
                      onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-emerald-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm text-gray-400 mb-1">Property Address</label>
                    <input
                      type="text"
                      value={newIncident.property_address}
                      onChange={(e) => setNewIncident({ ...newIncident, property_address: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm text-gray-400 mb-1">Description</label>
                    <textarea
                      value={newIncident.description}
                      onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={createIncident}
                    disabled={creating || !newIncident.title}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    {creating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                    Create Incident
                  </button>
                  <button
                    onClick={() => setShowNewForm(false)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : selectedIncident ? (
              <div className="space-y-6">
                {/* Incident Header */}
                <div className="bg-white/5 rounded-lg border border-white/10 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold">{selectedIncident.title}</h2>
                      <p className="text-gray-400">{selectedIncident.customer_name} • {selectedIncident.property_address}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded ${statusColors[selectedIncident.status]}`}>
                        {selectedIncident.status.replace('_', ' ')}
                      </span>
                      {selectedIncident.severity && (
                        <span className={`px-3 py-1 rounded border ${severityColors[selectedIncident.severity]}`}>
                          {selectedIncident.severity}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {selectedIncident.description && (
                    <p className="text-gray-300 mb-4">{selectedIncident.description}</p>
                  )}
                  
                  {/* Signature Status */}
                  {selectedIncident.signed_at && (
                    <div className={`p-3 rounded-lg ${selectedIncident.signature_type === 'acknowledged' ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                      {selectedIncident.signature_type === 'acknowledged' ? (
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle size={20} />
                          <span>Acknowledged on {new Date(selectedIncident.signed_at).toLocaleString()}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-400">
                          <XCircle size={20} />
                          <span>Refused on {new Date(selectedIncident.signed_at).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Image Upload Section */}
                <div className="bg-white/5 rounded-lg border border-white/10 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Camera size={20} />
                      Evidence Images
                    </h3>
                    <div className="flex gap-2">
                      <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg cursor-pointer transition-colors">
                        <Upload size={18} />
                        Upload Images
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      {selectedIncident.incident_images && selectedIncident.incident_images.length > 0 && (
                        <button
                          onClick={analyzeAllImages}
                          disabled={analyzing}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-lg transition-colors"
                        >
                          {analyzing ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                          Analyze All
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {uploadingImages && (
                    <div className="flex items-center gap-2 text-blue-400 mb-4">
                      <Loader2 className="animate-spin" size={18} />
                      Uploading images...
                    </div>
                  )}
                  
                  {selectedIncident.incident_images && selectedIncident.incident_images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedIncident.incident_images.map(image => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.url}
                            alt={image.filename}
                            className="w-full h-40 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-2 flex flex-col justify-between">
                            <div className="text-xs">
                              {image.ai_analysis?.severity && (
                                <span className={`px-2 py-1 rounded ${severityColors[image.ai_analysis.severity]}`}>
                                  {image.ai_analysis.severity}
                                </span>
                              )}
                            </div>
                            <div>
                              {image.ai_analysis?.detected_issues?.slice(0, 2).map((issue: string, i: number) => (
                                <span key={i} className="text-xs bg-white/20 px-2 py-1 rounded mr-1">
                                  {issue}
                                </span>
                              ))}
                              {!image.ai_analysis?.detected_issues && (
                                <button
                                  onClick={() => analyzeImage(image.id, image.url)}
                                  disabled={analyzing}
                                  className="text-xs bg-purple-500 px-2 py-1 rounded"
                                >
                                  Analyze
                                </button>
                              )}
                            </div>
                          </div>
                          {image.caption && (
                            <p className="text-xs text-gray-400 mt-1 truncate">{image.caption}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-lg">
                      <FileImage className="mx-auto mb-2 text-gray-500" size={40} />
                      <p className="text-gray-400">No images uploaded yet</p>
                      <p className="text-sm text-gray-500">Upload photos to analyze for the report</p>
                    </div>
                  )}
                </div>

                {/* AI Analysis Summary */}
                {selectedIncident.ai_analysis && Object.keys(selectedIncident.ai_analysis).length > 0 && (
                  <div className="bg-white/5 rounded-lg border border-white/10 p-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                      <AlertTriangle className="text-yellow-400" size={20} />
                      AI Analysis Summary
                    </h3>
                    <div className="space-y-3">
                      {selectedIncident.ai_analysis.summary && (
                        <p className="text-gray-300">{selectedIncident.ai_analysis.summary}</p>
                      )}
                      {selectedIncident.ai_analysis.detected_issues?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedIncident.ai_analysis.detected_issues.map((issue: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">
                              {issue}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Report Sections */}
                {selectedIncident.report_sections && Object.keys(selectedIncident.report_sections).length > 0 && (
                  <div className="bg-white/5 rounded-lg border border-white/10 p-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                      <FileText size={20} />
                      Generated Report
                    </h3>
                    
                    {selectedIncident.report_sections.executive_summary && (
                      <div className="mb-4">
                        <h4 className="text-sm text-emerald-400 uppercase tracking-wider mb-2">Executive Summary</h4>
                        <p className="text-gray-300">{selectedIncident.report_sections.executive_summary}</p>
                      </div>
                    )}
                    
                    {selectedIncident.report_sections.findings?.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm text-emerald-400 uppercase tracking-wider mb-2">Key Findings</h4>
                        <div className="space-y-2">
                          {selectedIncident.report_sections.findings.slice(0, 5).map((finding: any, i: number) => (
                            <div key={i} className="p-3 bg-white/5 rounded">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs px-2 py-0.5 rounded ${severityColors[finding.severity] || 'bg-gray-500/20'}`}>
                                  {finding.severity}
                                </span>
                                <span className="font-medium">{finding.issue}</span>
                              </div>
                              <p className="text-sm text-gray-400">{finding.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedIncident.report_sections.liability_statement && (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-200">
                        <strong>Liability Notice:</strong> {selectedIncident.report_sections.liability_statement}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {selectedIncident.status === 'draft' && selectedIncident.incident_images?.length > 0 && (
                    <button
                      onClick={generateReport}
                      disabled={generating}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      {generating ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
                      Generate Report
                    </button>
                  )}
                  
                  {(selectedIncident.status === 'pending_review' || selectedIncident.report_sections) && 
                   !selectedIncident.signed_at && selectedIncident.customer_email && (
                    <button
                      onClick={sendForSignature}
                      disabled={sending}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      {sending ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />}
                      Send for Signature
                    </button>
                  )}
                  
                  {selectedIncident.email_sent_at && !selectedIncident.signed_at && (
                    <div className="flex items-center gap-2 text-purple-400 px-4 py-2 bg-purple-500/10 rounded-lg">
                      <Clock size={18} />
                      Awaiting signature (sent {new Date(selectedIncident.email_sent_at).toLocaleDateString()})
                    </div>
                  )}
                  
                  <button
                    onClick={() => window.open(`/sign/${selectedIncident.signature_token}`, '_blank')}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <Eye size={18} />
                    Preview Signing Page
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-white/5 rounded-lg border border-white/10">
                <Shield className="mx-auto mb-4 text-gray-500" size={60} />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Select an Incident</h3>
                <p className="text-gray-500 mb-4">Choose an incident from the list or create a new one</p>
                <button
                  onClick={() => setShowNewForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
                >
                  <Plus size={18} />
                  Create New Incident
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
