'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import gsap from 'gsap';

interface CrawlResult {
  url: string;
  title: string;
  metaDescription: string;
  metaKeywords: string;
  headings: { h1: string[]; h2: string[]; h3: string[] };
  wordCount: number;
  links: { internal: number; external: number };
  images: { total: number; missingAlt: { src: string }[] };
  canonical: string | null;
  robotsMeta: string | null;
  openGraph: {
    title: string | null;
    description: string | null;
    image: string | null;
    type: string | null;
    url: string | null;
  };
  seoScore: number;
  opportunities: string[];
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-36 h-36">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="white" strokeOpacity={0.1} strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-[10px] uppercase tracking-wider text-white/50">SEO Score</span>
      </div>
    </div>
  );
}

export default function CrawlerPage() {
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<CrawlResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const radarRef = useRef<HTMLDivElement>(null);
  const sweepRef = useRef<HTMLDivElement>(null);

  // GSAP gold radar sweep animation
  useEffect(() => {
    if (!scanning || !sweepRef.current) return;

    const tl = gsap.timeline({ repeat: -1 });
    tl.to(sweepRef.current, {
      rotation: 360,
      duration: 1.5,
      ease: 'linear',
    });
    tl.to(
      sweepRef.current,
      {
        opacity: 0.3,
        duration: 0.75,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      },
      0
    );

    return () => {
      tl.kill();
    };
  }, [scanning]);

  const handleScan = async () => {
    if (!url.trim()) return;
    setScanning(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/greenline-hq" className="text-white/40 hover:text-white transition text-sm">
          HQ
        </Link>
        <span className="text-white/20">/</span>
        <span className="text-yellow-400/80 text-sm font-medium">SEO Crawler</span>
      </div>
      <h1 className="text-3xl font-bold text-white mb-1">Greenline Pulse</h1>
      <p className="text-white/50 mb-8">Scan any website for SEO health, gaps, and Greenline opportunities.</p>

      {/* URL Input */}
      <div className="flex gap-3 mb-10">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleScan()}
          placeholder="https://example.com"
          className="flex-1 px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 text-sm"
        />
        <button
          onClick={handleScan}
          disabled={scanning || !url.trim()}
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-semibold text-sm hover:opacity-90 transition disabled:opacity-40"
        >
          {scanning ? 'Scanning...' : 'Scan Website'}
        </button>
      </div>

      {/* Radar Animation (while scanning) */}
      <AnimatePresence>
        {scanning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div ref={radarRef} className="relative w-40 h-40 mb-6">
              {/* Radar base */}
              <div className="absolute inset-0 rounded-full border-2 border-yellow-400/20" />
              <div className="absolute inset-4 rounded-full border border-yellow-400/10" />
              <div className="absolute inset-8 rounded-full border border-yellow-400/5" />
              {/* Center dot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-yellow-400" />
              {/* Sweep arc */}
              <div
                ref={sweepRef}
                className="absolute inset-0"
                style={{ transformOrigin: 'center center' }}
              >
                <div
                  className="absolute top-0 left-1/2 h-1/2 w-1/2 origin-bottom-left"
                  style={{
                    background:
                      'conic-gradient(from 0deg, transparent 0deg, rgba(212,175,55,0.4) 30deg, transparent 60deg)',
                  }}
                />
              </div>
            </div>
            <p className="text-yellow-400/70 text-sm animate-pulse">Scanning target...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Score + URL */}
          <div className="flex flex-col md:flex-row items-center gap-8 p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <ScoreRing score={result.seoScore} />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-white truncate mb-1">{result.title || 'Untitled'}</h2>
              <p className="text-white/40 text-sm truncate mb-3">{result.url}</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-full bg-white/5 text-white/60 text-xs">{result.wordCount} words</span>
                <span className="px-2.5 py-1 rounded-full bg-white/5 text-white/60 text-xs">{result.links.internal} internal links</span>
                <span className="px-2.5 py-1 rounded-full bg-white/5 text-white/60 text-xs">{result.links.external} external links</span>
                <span className="px-2.5 py-1 rounded-full bg-white/5 text-white/60 text-xs">{result.images.total} images</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Meta Tags */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
              <h3 className="text-sm font-semibold text-yellow-400/80 uppercase tracking-wider mb-4">Meta Tags</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-white/40">Title</dt>
                  <dd className="text-white/80">{result.title || <span className="text-red-400">Missing</span>}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Description</dt>
                  <dd className="text-white/80">{result.metaDescription || <span className="text-red-400">Missing</span>}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Keywords</dt>
                  <dd className="text-white/80">{result.metaKeywords || <span className="text-white/30">None</span>}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Canonical</dt>
                  <dd className="text-white/80 truncate">{result.canonical || <span className="text-red-400">Missing</span>}</dd>
                </div>
                <div>
                  <dt className="text-white/40">Robots</dt>
                  <dd className="text-white/80">{result.robotsMeta || <span className="text-white/30">Not set</span>}</dd>
                </div>
              </dl>
            </div>

            {/* H-Tag Structure */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
              <h3 className="text-sm font-semibold text-yellow-400/80 uppercase tracking-wider mb-4">H-Tag Structure</h3>
              <div className="space-y-3 text-sm max-h-52 overflow-y-auto">
                {result.headings.h1.map((h, i) => (
                  <div key={`h1-${i}`} className="flex items-start gap-2">
                    <span className="shrink-0 px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-bold">H1</span>
                    <span className="text-white/80">{h}</span>
                  </div>
                ))}
                {result.headings.h2.map((h, i) => (
                  <div key={`h2-${i}`} className="flex items-start gap-2 pl-3">
                    <span className="shrink-0 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold">H2</span>
                    <span className="text-white/70">{h}</span>
                  </div>
                ))}
                {result.headings.h3.map((h, i) => (
                  <div key={`h3-${i}`} className="flex items-start gap-2 pl-6">
                    <span className="shrink-0 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-bold">H3</span>
                    <span className="text-white/60">{h}</span>
                  </div>
                ))}
                {result.headings.h1.length === 0 && result.headings.h2.length === 0 && result.headings.h3.length === 0 && (
                  <p className="text-white/30">No headings found</p>
                )}
              </div>
            </div>

            {/* Content Density */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
              <h3 className="text-sm font-semibold text-yellow-400/80 uppercase tracking-wider mb-4">Content Density</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-2xl font-bold text-white">{result.wordCount}</div>
                  <div className="text-white/40">Total Words</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{result.images.total}</div>
                  <div className="text-white/40">Images</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{result.links.internal}</div>
                  <div className="text-white/40">Internal Links</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{result.links.external}</div>
                  <div className="text-white/40">External Links</div>
                </div>
              </div>
              {result.images.missingAlt.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 text-xs font-medium">{result.images.missingAlt.length} image(s) missing alt text</p>
                </div>
              )}
            </div>

            {/* Open Graph */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
              <h3 className="text-sm font-semibold text-yellow-400/80 uppercase tracking-wider mb-4">Open Graph</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-white/40">OG Title</dt>
                  <dd className="text-white/80">{result.openGraph.title || <span className="text-red-400">Missing</span>}</dd>
                </div>
                <div>
                  <dt className="text-white/40">OG Description</dt>
                  <dd className="text-white/80 line-clamp-2">{result.openGraph.description || <span className="text-red-400">Missing</span>}</dd>
                </div>
                <div>
                  <dt className="text-white/40">OG Image</dt>
                  <dd className="text-white/80 truncate">{result.openGraph.image || <span className="text-red-400">Missing</span>}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Greenline Opportunity Gaps */}
          {result.opportunities.length > 0 && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-yellow-400/10 to-amber-600/10 border border-yellow-400/20">
              <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-4">Greenline Opportunity Gaps</h3>
              <ul className="space-y-2">
                {result.opportunities.map((gap, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-yellow-400 shrink-0 mt-0.5">&#x25CF;</span>
                    <span className="text-white/70">{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Distribution Dock button */}
          <div className="flex justify-center pt-4">
            <Link
              href={`/greenline-hq/audit?url=${encodeURIComponent(result.url)}&score=${result.seoScore}`}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-semibold text-sm hover:opacity-90 transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
              Distribution Dock
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
