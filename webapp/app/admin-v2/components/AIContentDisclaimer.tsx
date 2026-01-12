'use client';

import { useState } from 'react';

interface AIContentDisclaimerProps {
  compact?: boolean;
  showToggle?: boolean;
}

export default function AIContentDisclaimer({ compact = false, showToggle = true }: AIContentDisclaimerProps) {
  const [expanded, setExpanded] = useState(!compact);

  if (compact && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs hover:bg-purple-500/20 transition"
      >
        <span>🤖</span>
        <span>AI Content Notice</span>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h4 className="text-sm font-semibold text-purple-300 mb-1">AI-Generated Content Notice</h4>
            <div className="text-xs text-white/60 space-y-2">
              <p>
                Content created with AI assistance may have unique legal considerations:
              </p>
              <ul className="space-y-1 ml-4">
                <li>• <strong className="text-white/80">Copyright Protection:</strong> AI-generated content may have limited or no copyright protection in most jurisdictions. Human creative input can strengthen claims.</li>
                <li>• <strong className="text-white/80">Ownership:</strong> Check your AI provider's terms regarding who owns the generated content.</li>
                <li>• <strong className="text-white/80">Originality:</strong> AI may produce content similar to its training data. Review outputs for potential issues.</li>
                <li>• <strong className="text-white/80">Disclosure:</strong> Consider being transparent about AI assistance for ethical content creation.</li>
              </ul>
              <p className="text-white/40 italic mt-2">
                This is general information, not legal advice. Consult a qualified attorney for specific questions.
              </p>
            </div>
          </div>
        </div>
        {showToggle && (
          <button
            onClick={() => setExpanded(false)}
            className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-white transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-2">
        <a
          href="/copyright-guide"
          target="_blank"
          className="px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-xs hover:bg-white/10 hover:text-white transition"
        >
          📚 Full Copyright Guide
        </a>
        <button
          onClick={() => {
            const disclaimer = `This content was created with AI assistance. While human direction and editing were provided, portions may be AI-generated. © ${new Date().getFullYear()} [Your Name]. Some elements may have limited copyright protection.`;
            navigator.clipboard.writeText(disclaimer);
          }}
          className="px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-xs hover:bg-white/10 hover:text-white transition"
        >
          📋 Copy Disclaimer Template
        </button>
      </div>
    </div>
  );
}
