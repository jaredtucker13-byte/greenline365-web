'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/os';

export default function BlogPolishPage() {
  const [blogText, setBlogText] = useState('');
  const [title, setTitle] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [seoScore, setSeoScore] = useState<number | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files).slice(0, 5);
      setImages(fileArray);
    }
  };

  const analyzeSEO = async () => {
    setAnalyzing(true);
    // TODO: Call API for SEO analysis
    setTimeout(() => {
      setSeoScore(78);
      setAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-os-dark p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-display font-bold text-white mb-8">
          Blog Auto-Polish
        </h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Editor Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className="os-card p-6">
              <label className="text-white/70 text-sm mb-2 block">Blog Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter your blog title..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:border-neon-green-500 focus:outline-none"
              />
            </div>

            {/* Content Editor */}
            <div className="os-card p-6">
              <label className="text-white/70 text-sm mb-2 block">Blog Content</label>
              <textarea
                value={blogText}
                onChange={(e) => setBlogText(e.target.value)}
                placeholder="Write your blog content here in your authentic voice..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:border-neon-green-500 focus:outline-none min-h-[400px] font-mono text-sm"
              />
              <div className="mt-4 flex items-center justify-between">
                <span className="text-white/50 text-sm">
                  {blogText.split(/\s+/).filter(w => w).length} words
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={analyzeSEO}
                  disabled={analyzing || !blogText}
                >
                  {analyzing ? 'Analyzing...' : 'Analyze SEO'}
                </Button>
              </div>
            </div>

            {/* Image Upload */}
            <div className="os-card p-6">
              <label className="text-white/70 text-sm mb-2 block">Upload Images (up to 5)</label>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-neon-green-500/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="text-4xl mb-2">📸</div>
                  <p className="text-white/70">Click or drag images here</p>
                  <p className="text-white/50 text-sm mt-1">PNG, JPG, WebP (max 10MB each)</p>
                </label>
              </div>
              
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="aspect-square bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                      <span className="text-white/50 text-xs">{img.name.slice(0, 10)}...</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - SEO & Actions */}
          <div className="space-y-6">
            {/* SEO Score */}
            {seoScore !== null && (
              <div className="os-card p-6">
                <h3 className="text-white font-bold mb-4">SEO Analysis</h3>
                <div className="flex items-center justify-center mb-4">
                  <div className="relative w-32 h-32">
                    <svg className="transform -rotate-90 w-32 h-32">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#00FF88"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - seoScore / 100)}`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-neon-green-500">{seoScore}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-neon-green-500">✓</span>
                    <span className="text-white/70">Good keyword density</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neon-green-500">✓</span>
                    <span className="text-white/70">Proper heading structure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500">⚠</span>
                    <span className="text-white/70">Add more internal links</span>
                  </div>
                </div>
              </div>
            )}

            {/* AI Enhancement */}
            <div className="os-card p-6">
              <h3 className="text-white font-bold mb-4">AI Enhancement</h3>
              <p className="text-white/70 text-sm mb-4">
                Want to see an AI-enhanced version while keeping your voice?
              </p>
              <Button variant="secondary" className="w-full" disabled={!blogText}>
                Generate Alternative
              </Button>
            </div>

            {/* Actions */}
            <div className="os-card p-6">
              <h3 className="text-white font-bold mb-4">Publish Options</h3>
              <div className="space-y-3">
                <Button variant="primary" className="w-full" disabled={!title || !blogText}>
                  Auto-Polish & Preview
                </Button>
                <Button variant="secondary" className="w-full">
                  Save as Draft
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="os-card p-6">
              <h3 className="text-white font-bold mb-4">Blog Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">Word Count</span>
                  <span className="text-white">{blogText.split(/\s+/).filter(w => w).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Images</span>
                  <span className="text-white">{images.length} / 5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Read Time</span>
                  <span className="text-white">
                    {Math.ceil(blogText.split(/\s+/).filter(w => w).length / 200)} min
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
