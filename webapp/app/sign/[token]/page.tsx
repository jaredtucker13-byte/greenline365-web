'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Shield, CheckCircle, XCircle, AlertTriangle, FileText, 
  Camera, Loader2, Clock, MapPin, User, Download
} from 'lucide-react';

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  customer_name: string;
  property_address: string;
  report_sections: any;
  ai_analysis: any;
  created_at: string;
  signed_at: string | null;
  signature_type: string | null;
  incident_images: Array<{
    id: string;
    url: string;
    caption: string;
    ai_analysis: any;
  }>;
}

const severityColors: Record<string, string> = {
  low: 'bg-green-500/20 text-green-400 border-green-500',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500',
  critical: 'bg-red-500/20 text-red-400 border-red-500'
};

export default function SignPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signerName, setSignerName] = useState('');
  const [refusalReason, setRefusalReason] = useState('');
  const [showRefusalForm, setShowRefusalForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const res = await fetch(`/api/incidents/sign?token=${token}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to load incident');
        }
        const data = await res.json();
        setIncident(data);
        
        // Pre-fill signer name if available
        if (data.customer_name) {
          setSignerName(data.customer_name);
        }
        
        // Check if already signed
        if (data.signed_at) {
          setSubmitted(true);
          setResult({
            action: data.signature_type === 'acknowledged' ? 'acknowledge' : 'refuse',
            timestamp: data.signed_at
          });
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchIncident();
    }
  }, [token]);

  const handleSubmit = async (action: 'acknowledge' | 'refuse') => {
    if (!signerName.trim()) {
      alert('Please enter your name');
      return;
    }
    
    if (action === 'refuse' && !refusalReason.trim()) {
      alert('Please provide a reason for refusing');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/incidents/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          action,
          signer_name: signerName,
          refusal_reason: action === 'refuse' ? refusalReason : undefined
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit');
      }

      setResult(data);
      setSubmitted(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-emerald-400" size={40} />
          <p className="text-gray-400">Loading incident report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 max-w-md text-center">
          <XCircle className="mx-auto mb-4 text-red-400" size={50} />
          <h1 className="text-xl font-bold text-white mb-2">Unable to Load Report</h1>
          <p className="text-gray-400">{error}</p>
          <p className="text-sm text-gray-500 mt-4">
            This link may have expired or already been used. Please contact the sender for assistance.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className={`rounded-lg p-8 max-w-md text-center ${
          result?.action === 'acknowledge' 
            ? 'bg-emerald-500/10 border border-emerald-500/30' 
            : 'bg-orange-500/10 border border-orange-500/30'
        }`}>
          {result?.action === 'acknowledge' ? (
            <>
              <CheckCircle className="mx-auto mb-4 text-emerald-400" size={60} />
              <h1 className="text-2xl font-bold text-white mb-2">Report Acknowledged</h1>
              <p className="text-gray-300 mb-4">
                Thank you for reviewing and acknowledging this incident report.
              </p>
            </>
          ) : (
            <>
              <AlertTriangle className="mx-auto mb-4 text-orange-400" size={60} />
              <h1 className="text-2xl font-bold text-white mb-2">Refusal Recorded</h1>
              <p className="text-gray-300 mb-4">
                Your refusal has been recorded and will be reviewed.
              </p>
            </>
          )}
          
          <div className="bg-white/5 rounded p-4 text-sm text-gray-400">
            <p><strong>Confirmation:</strong> {result?.confirmation_hash}</p>
            <p><strong>Timestamp:</strong> {new Date(result?.timestamp).toLocaleString()}</p>
          </div>
          
          <p className="text-xs text-gray-500 mt-6">
            A copy of this confirmation has been recorded. You may close this window.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-white/10 py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="text-emerald-400" size={28} />
            <span className="font-bold text-lg">GreenLine365</span>
          </div>
          <span className="text-sm text-gray-400">Incident Documentation</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Report Header */}
        <div className="bg-white/5 rounded-lg border border-white/10 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">{incident?.title}</h1>
              <div className="flex items-center gap-4 text-gray-400 text-sm">
                <span className="flex items-center gap-1">
                  <User size={14} />
                  {incident?.customer_name}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {incident?.property_address}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {new Date(incident?.created_at || '').toLocaleDateString()}
                </span>
              </div>
            </div>
            {incident?.severity && (
              <span className={`px-4 py-2 rounded-lg border-2 font-semibold ${severityColors[incident.severity]}`}>
                {incident.severity.toUpperCase()} SEVERITY
              </span>
            )}
          </div>
          
          {incident?.description && (
            <p className="text-gray-300">{incident.description}</p>
          )}
        </div>

        {/* Evidence Images */}
        {incident?.incident_images && incident.incident_images.length > 0 && (
          <div className="bg-white/5 rounded-lg border border-white/10 p-6 mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Camera size={20} />
              Documented Evidence ({incident.incident_images.length} images)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {incident.incident_images.map((image, index) => (
                <div key={image.id} className="relative">
                  <img
                    src={image.url}
                    alt={`Evidence ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  {image.caption && (
                    <p className="text-xs text-gray-400 mt-1">{image.caption}</p>
                  )}
                  {image.ai_analysis?.severity && (
                    <span className={`absolute top-2 right-2 text-xs px-2 py-1 rounded ${severityColors[image.ai_analysis.severity]}`}>
                      {image.ai_analysis.severity}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report Findings */}
        {incident?.report_sections && (
          <div className="bg-white/5 rounded-lg border border-white/10 p-6 mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <FileText size={20} />
              Inspection Findings
            </h2>
            
            {incident.report_sections.executive_summary && (
              <div className="mb-6">
                <h3 className="text-emerald-400 text-sm uppercase tracking-wider mb-2">Summary</h3>
                <p className="text-gray-300">{incident.report_sections.executive_summary}</p>
              </div>
            )}
            
            {incident.report_sections.findings?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-emerald-400 text-sm uppercase tracking-wider mb-3">Key Findings</h3>
                <div className="space-y-3">
                  {incident.report_sections.findings.map((finding: any, i: number) => (
                    <div key={i} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded ${severityColors[finding.severity] || 'bg-gray-500/20'}`}>
                          {finding.severity?.toUpperCase()}
                        </span>
                        <span className="font-semibold">{finding.issue}</span>
                      </div>
                      <p className="text-sm text-gray-400">{finding.description}</p>
                      {finding.recommended_action && (
                        <p className="text-sm text-emerald-400 mt-2">
                          <strong>Recommended:</strong> {finding.recommended_action}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {incident.report_sections.recommendations?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-emerald-400 text-sm uppercase tracking-wider mb-3">Recommendations</h3>
                <ol className="list-decimal list-inside space-y-2">
                  {incident.report_sections.recommendations.map((rec: any, i: number) => (
                    <li key={i} className="text-gray-300">
                      <span className="font-medium">{rec.action}</span>
                      <span className="text-gray-500 text-sm ml-2">({rec.estimated_urgency})</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Liability Notice */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm">
              <p className="text-yellow-200 font-medium mb-1">Important Notice</p>
              <p className="text-yellow-200/80">
                {incident?.report_sections?.liability_statement || 
                  "This report documents conditions as observed at the time of inspection. By acknowledging this report, you confirm that you have reviewed the documented findings. This acknowledgment does not constitute admission of liability by any party."}
              </p>
            </div>
          </div>
        </div>

        {/* Signature Section */}
        <div className="bg-white/5 rounded-lg border border-white/10 p-6">
          <h2 className="text-lg font-semibold mb-4">Your Response</h2>
          
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">Your Full Name *</label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Enter your full legal name"
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-emerald-500 text-white"
            />
          </div>

          {showRefusalForm ? (
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">
                Reason for Refusal *
              </label>
              <textarea
                value={refusalReason}
                onChange={(e) => setRefusalReason(e.target.value)}
                placeholder="Please explain why you are refusing to acknowledge this report..."
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-orange-500 text-white"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleSubmit('refuse')}
                  disabled={submitting || !signerName.trim() || !refusalReason.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded-lg font-semibold transition-colors"
                >
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : <XCircle size={20} />}
                  Submit Refusal
                </button>
                <button
                  onClick={() => setShowRefusalForm(false)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => handleSubmit('acknowledge')}
                disabled={submitting || !signerName.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-lg font-semibold text-lg transition-colors"
              >
                {submitting ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle size={24} />}
                I Acknowledge This Report
              </button>
              <button
                onClick={() => setShowRefusalForm(true)}
                disabled={submitting}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition-colors"
              >
                <XCircle size={20} />
                I Refuse
              </button>
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-4 text-center">
            By clicking "I Acknowledge", you confirm that you have reviewed the findings documented in this report.
            Your response will be recorded along with the date, time, and IP address for verification purposes.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>GreenLine365 • Professional Documentation Services</p>
          <p className="mt-1">This is a secure document. Your response is legally recorded.</p>
        </div>
      </footer>
    </div>
  );
}
