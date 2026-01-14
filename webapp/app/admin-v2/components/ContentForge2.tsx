'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from './PageHeader';

// Types
interface Blueprint {
  id: string;
  blueprint_code: string;
  blueprint_name: string;
  blueprint_icon: string;
  category: string;
  difficulty_level: string;
  estimated_time_minutes: number;
  emotional_arc: string;
  ideal_word_count_min: number;
  ideal_word_count_max: number;
  outputs_to: string[];
  structure: { sections: { id: string; name: string }[] };
}

interface ContentScores {
  overall: number;
  hook_score: number;
  structure_score: number;
  cta_score: number;
  readability_score: number;
  word_count: number;
}

interface Prediction {
  predicted_engagement_score: number;
  predicted_shares: number;
  predicted_time_on_page_seconds: number;
  confidence_level: number;
  optimization_suggestions: string[];
}

// Score Ring Component
const ScoreRing = ({ score, label, size = 60 }: { score: number; label: string; size?: number }) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getColor = (s: number) => {
    if (s >= 80) return '#00ff00';
    if (s >= 60) return '#ffff00';
    return '#ff4444';
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="4"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={getColor(score)}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <span className="text-lg font-bold text-white -mt-10">{score}</span>
      <span className="text-[10px] text-white/50 mt-4">{label}</span>
    </div>
  );
};

// Blueprint Card Component
const BlueprintCard = ({ 
  blueprint, 
  isSelected, 
  onClick 
}: { 
  blueprint: Blueprint; 
  isSelected: boolean; 
  onClick: () => void;
}) => {
  const categoryColors: Record<string, string> = {
    authority: 'border-blue-500/50 bg-blue-500/10',
    seo: 'border-green-500/50 bg-green-500/10',
    trust: 'border-purple-500/50 bg-purple-500/10',
    conversion: 'border-orange-500/50 bg-orange-500/10',
    viral: 'border-pink-500/50 bg-pink-500/10'
  };

  return (
    <motion.button
      onClick={onClick}
      className={`relative p-4 rounded-xl border-2 transition-all text-left w-full ${
        isSelected 
          ? 'border-neon-green-500 bg-neon-green-500/20 ring-2 ring-neon-green-500/50' 
          : `${categoryColors[blueprint.category] || 'border-white/20 bg-white/5'} hover:border-white/40`
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{blueprint.blueprint_icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-sm truncate">{blueprint.blueprint_name}</h3>
          <p className="text-[10px] text-white/50 uppercase tracking-wider">{blueprint.category}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[10px] text-white/40">
        <span>~{blueprint.estimated_time_minutes}min</span>
        <span>•</span>
        <span>{blueprint.ideal_word_count_min}-{blueprint.ideal_word_count_max} words</span>
      </div>
      {isSelected && (
        <motion.div 
          className="absolute top-2 right-2 w-5 h-5 bg-neon-green-500 rounded-full flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
};

// Repurpose Button Component
const RepurposeButton = ({ 
  platform, 
  icon, 
  isLoading, 
  content,
  onClick 
}: { 
  platform: string; 
  icon: string; 
  isLoading: boolean;
  content?: string;
  onClick: () => void;
}) => (
  <motion.button
    onClick={onClick}
    disabled={isLoading}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
      content 
        ? 'border-neon-green-500/50 bg-neon-green-500/20 text-neon-green-400' 
        : 'border-white/20 bg-white/5 text-white/70 hover:border-white/40'
    }`}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <span>{icon}</span>
    <span className="text-xs">{platform}</span>
    {isLoading && (
      <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    )}
    {content && !isLoading && (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    )}
  </motion.button>
);

// Main Component
export default function ContentForge2() {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null);
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('Local business owners');
  const [tone, setTone] = useState('professional');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [scores, setScores] = useState<ContentScores | null>(null);
  const [predictions, setPredictions] = useState<Prediction | null>(null);
  const [headlines, setHeadlines] = useState<any[]>([]);
  
  const [repurposedContent, setRepurposedContent] = useState<Record<string, string>>({});
  const [repurposeLoading, setRepurposeLoading] = useState<Record<string, boolean>>({});
  
  const [activeTab, setActiveTab] = useState<'create' | 'calendar'>('create');
  const [calendarItems, setCalendarItems] = useState<any[]>([]);
  const [isGeneratingCalendar, setIsGeneratingCalendar] = useState(false);

  // Fetch blueprints
  useEffect(() => {
    fetch('/api/content-forge-2?action=blueprints')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBlueprints(data.blueprints);
        }
      })
      .catch(console.error);
  }, []);

  // Generate content
  const handleGenerate = async () => {
    if (!selectedBlueprint || !topic) return;
    
    setIsGenerating(true);
    setGeneratedContent('');
    setScores(null);
    setPredictions(null);
    setHeadlines([]);
    setRepurposedContent({});
    
    try {
      const response = await fetch('/api/content-forge-2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          blueprint_code: selectedBlueprint.blueprint_code,
          topic,
          target_audience: targetAudience,
          tone
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setGeneratedContent(data.content.full_content);
        setScores(data.scores);
        setPredictions(data.predictions);
        setHeadlines(data.headline_variants || []);
      }
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Repurpose content
  const handleRepurpose = async (format: string) => {
    if (!generatedContent) return;
    
    setRepurposeLoading(prev => ({ ...prev, [format]: true }));
    
    try {
      const response = await fetch('/api/content-forge-2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'repurpose',
          content: generatedContent,
          title: topic,
          format
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRepurposedContent(prev => ({ ...prev, [format]: data.content }));
      }
    } catch (error) {
      console.error('Repurpose error:', error);
    } finally {
      setRepurposeLoading(prev => ({ ...prev, [format]: false }));
    }
  };

  // Generate calendar
  const handleGenerateCalendar = async () => {
    setIsGeneratingCalendar(true);
    
    // For demo, create sample pillars
    const samplePillars = [
      { id: '1', pillar_name: 'Marketing Tips', target_audience: 'Local business owners' },
      { id: '2', pillar_name: 'Case Studies', target_audience: 'Local business owners' },
      { id: '3', pillar_name: 'Industry Insights', target_audience: 'Local business owners' },
      { id: '4', pillar_name: 'How-To Guides', target_audience: 'Local business owners' }
    ];
    
    try {
      const response = await fetch('/api/content-forge-2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'calendar_generate',
          tenant_id: null,
          pillars: samplePillars,
          weeks: 4
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCalendarItems(data.calendar);
      }
    } catch (error) {
      console.error('Calendar generation error:', error);
    } finally {
      setIsGeneratingCalendar(false);
    }
  };

  return (
    <div className="min-h-screen bg-os-dark">
      {/* Navigation Header */}
      <PageHeader
        title="Content Forge 2.0"
        icon="🔮"
        subtitle="Temporal Content Architecture • From 15 Years in the Future"
        showBack
        showBreadcrumbs
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'create' 
                  ? 'bg-neon-green-500 text-black' 
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              ⚡ Create Content
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'calendar' 
                  ? 'bg-neon-green-500 text-black' 
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              📅 4-Week Calendar
            </button>
          </div>
        }
      />

      <div className="p-6">

      <AnimatePresence mode="wait">
        {activeTab === 'create' ? (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-12 gap-6"
          >
            {/* Left Column - Blueprint Selection & Input */}
            <div className="col-span-4 space-y-6">
              {/* Blueprint Selector */}
              <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
                <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-neon-green-500">01</span>
                  Select Blueprint
                </h2>
                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2">
                  {blueprints.map(bp => (
                    <BlueprintCard
                      key={bp.id}
                      blueprint={bp}
                      isSelected={selectedBlueprint?.id === bp.id}
                      onClick={() => setSelectedBlueprint(bp)}
                    />
                  ))}
                </div>
              </div>

              {/* Topic Input */}
              <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
                <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-neon-green-500">02</span>
                  Define Topic
                </h2>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-white/50 uppercase tracking-wider">Topic / Title</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., How to get more 5-star reviews"
                      className="w-full mt-1 px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:border-neon-green-500 focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] text-white/50 uppercase tracking-wider">Target Audience</label>
                    <input
                      type="text"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="e.g., Local restaurant owners"
                      className="w-full mt-1 px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/30 focus:border-neon-green-500 focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] text-white/50 uppercase tracking-wider">Tone</label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white text-sm focus:border-neon-green-500 focus:outline-none"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual & Friendly</option>
                      <option value="bold">Bold & Contrarian</option>
                      <option value="empathetic">Empathetic & Supportive</option>
                    </select>
                  </div>
                </div>
                
                <button
                  onClick={handleGenerate}
                  disabled={!selectedBlueprint || !topic || isGenerating}
                  className="w-full mt-4 py-3 bg-gradient-to-r from-neon-green-500 to-emerald-600 text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Manifesting Content...
                    </>
                  ) : (
                    <>
                      <span>🔮</span>
                      Generate Content
                    </>
                  )}
                </button>
              </div>

              {/* Quality Scores */}
              {scores && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 rounded-2xl border border-white/10 p-4"
                >
                  <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-neon-green-500">📊</span>
                    Quality Scores
                  </h2>
                  
                  <div className="flex justify-around mb-4">
                    <ScoreRing score={scores.overall} label="Overall" size={70} />
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    <ScoreRing score={scores.hook_score} label="Hook" size={50} />
                    <ScoreRing score={scores.structure_score} label="Structure" size={50} />
                    <ScoreRing score={scores.cta_score} label="CTA" size={50} />
                    <ScoreRing score={scores.readability_score} label="Readable" size={50} />
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/10 text-xs text-white/50">
                    <div className="flex justify-between">
                      <span>Word Count:</span>
                      <span className="text-white">{scores.word_count}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Predictions */}
              {predictions && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-500/30 p-4"
                >
                  <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <span>🔮</span>
                    Temporal Predictions
                  </h2>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Engagement Score</span>
                      <span className="text-white font-bold">{(predictions.predicted_engagement_score * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Predicted Shares</span>
                      <span className="text-white font-bold">{predictions.predicted_shares}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Avg. Time on Page</span>
                      <span className="text-white font-bold">{Math.round(predictions.predicted_time_on_page_seconds / 60)}m {predictions.predicted_time_on_page_seconds % 60}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Confidence</span>
                      <span className="text-white font-bold">{(predictions.confidence_level * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  {predictions.optimization_suggestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-[10px] text-white/50 uppercase mb-2">Suggestions</p>
                      {predictions.optimization_suggestions.map((s, i) => (
                        <p key={i} className="text-xs text-yellow-400/80 flex items-start gap-1">
                          <span>⚡</span> {s}
                        </p>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Middle Column - Generated Content */}
            <div className="col-span-5">
              <div className="bg-white/5 rounded-2xl border border-white/10 p-4 h-full">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="text-neon-green-500">03</span>
                    Generated Content
                  </h2>
                  {generatedContent && (
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedContent)}
                      className="text-xs text-white/50 hover:text-white flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </button>
                  )}
                </div>
                
                <div className="bg-black/30 rounded-xl p-4 h-[600px] overflow-y-auto">
                  {isGenerating ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="w-16 h-16 border-4 border-neon-green-500/30 border-t-neon-green-500 rounded-full animate-spin mb-4" />
                      <p className="text-white/50 text-sm">Manifesting content from the future...</p>
                    </div>
                  ) : generatedContent ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-white/90 text-sm leading-relaxed">
                        {generatedContent}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <span className="text-4xl mb-3">🔮</span>
                      <p className="text-white/50 text-sm">Select a blueprint and topic</p>
                      <p className="text-white/30 text-xs mt-1">Then click Generate to manifest content</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Headlines & Repurpose */}
            <div className="col-span-3 space-y-6">
              {/* Headline Variants */}
              {headlines.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 rounded-2xl border border-white/10 p-4"
                >
                  <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <span>📰</span>
                    Headline Variants
                  </h2>
                  
                  <div className="space-y-2">
                    {headlines.map((h, i) => (
                      <div
                        key={i}
                        className="p-2 bg-black/30 rounded-lg cursor-pointer hover:bg-black/50 transition-colors"
                        onClick={() => setTopic(h.headline)}
                      >
                        <p className="text-sm text-white">{h.headline}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 bg-neon-green-500/20 text-neon-green-400 rounded">
                            CTR: {h.ctr_score}/10
                          </span>
                          <span className="text-[10px] text-white/40">{h.approach}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Repurpose */}
              {generatedContent && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 rounded-2xl border border-white/10 p-4"
                >
                  <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <span>🔄</span>
                    One-Click Repurpose
                  </h2>
                  
                  <div className="flex flex-wrap gap-2">
                    <RepurposeButton
                      platform="Twitter"
                      icon="𝕏"
                      isLoading={repurposeLoading['twitter_thread']}
                      content={repurposedContent['twitter_thread']}
                      onClick={() => handleRepurpose('twitter_thread')}
                    />
                    <RepurposeButton
                      platform="LinkedIn"
                      icon="in"
                      isLoading={repurposeLoading['linkedin']}
                      content={repurposedContent['linkedin']}
                      onClick={() => handleRepurpose('linkedin')}
                    />
                    <RepurposeButton
                      platform="Email"
                      icon="✉️"
                      isLoading={repurposeLoading['email']}
                      content={repurposedContent['email']}
                      onClick={() => handleRepurpose('email')}
                    />
                    <RepurposeButton
                      platform="Video"
                      icon="🎬"
                      isLoading={repurposeLoading['video_script']}
                      content={repurposedContent['video_script']}
                      onClick={() => handleRepurpose('video_script')}
                    />
                  </div>
                  
                  {/* Show repurposed content */}
                  {Object.entries(repurposedContent).map(([format, content]) => (
                    <motion.div
                      key={format}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 p-3 bg-black/30 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white uppercase">{format.replace('_', ' ')}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(content)}
                          className="text-[10px] text-neon-green-400"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-xs text-white/70 whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {content}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          // Calendar Tab
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">4-Week Content Calendar</h2>
                  <p className="text-sm text-white/50">AI-generated content plan based on your pillars</p>
                </div>
                <button
                  onClick={handleGenerateCalendar}
                  disabled={isGeneratingCalendar}
                  className="px-4 py-2 bg-gradient-to-r from-neon-green-500 to-emerald-600 text-black font-bold rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {isGeneratingCalendar ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <span>🗓️</span>
                      Generate 4-Week Plan
                    </>
                  )}
                </button>
              </div>
              
              {calendarItems.length > 0 ? (
                <div className="grid grid-cols-4 gap-4">
                  {calendarItems.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-black/30 rounded-xl p-4 border border-white/10 hover:border-neon-green-500/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{item.blueprint_icon}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full text-white/50">
                          Week {i + 1}
                        </span>
                      </div>
                      <p className="text-xs text-white/50 mb-1">{item.scheduled_date}</p>
                      <h3 className="text-sm font-bold text-white mb-2 line-clamp-2">{item.working_title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 bg-neon-green-500/20 text-neon-green-400 rounded">
                          {item.blueprint_name}
                        </span>
                        <span className="text-[10px] text-white/40">{item.pillar_name}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <span className="text-5xl mb-4">📅</span>
                  <p className="text-white/50">Click "Generate 4-Week Plan" to create your content calendar</p>
                  <p className="text-white/30 text-sm mt-1">AI will generate titles based on your content pillars</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
