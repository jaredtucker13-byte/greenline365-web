'use client';

/**
 * Content Forge Hub - Central hub for all content creation tools.
 *
 * Tabs:
 * - Content Writer (inline ContentForge2)
 * - Blog Writer (links to /admin-v2/blog-polish)
 * - Image Generator (inline)
 * - Ingredients (links to /admin-v2/ingredients)
 * - Content Calendar
 */

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, PenTool, Image as ImageIcon, ChefHat,
  Calendar, ArrowRight, Sparkles, Loader2,
} from 'lucide-react';
import ContentForge2 from '../components/ContentForge2';
import ImageGenerator from './ImageGenerator';
import ActionBar from '../components/shared/ActionBar';

// ─── Tab Config ─────────────────────────────────────────────────────

interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  /** If set, tab navigates to this route instead of rendering inline */
  href?: string;
}

const TABS: TabConfig[] = [
  {
    id: 'writer',
    label: 'Content Writer',
    icon: <Sparkles className="w-4 h-4" />,
    description: 'AI-powered content generation with blueprints',
    color: '#C9A96E',
  },
  {
    id: 'blog',
    label: 'Blog Writer',
    icon: <PenTool className="w-4 h-4" />,
    description: 'Write, polish, and publish blog posts',
    color: '#8B5CF6',
    href: '/admin-v2/blog-polish',
  },
  {
    id: 'image',
    label: 'Image Generator',
    icon: <ImageIcon className="w-4 h-4" />,
    description: 'Create images from text descriptions',
    color: '#EC4899',
  },
  {
    id: 'ingredients',
    label: 'Ingredients',
    icon: <ChefHat className="w-4 h-4" />,
    description: 'Stock photo library & mockup generator',
    color: '#06B6D4',
    href: '/admin-v2/ingredients',
  },
  {
    id: 'calendar',
    label: 'Content Calendar',
    icon: <Calendar className="w-4 h-4" />,
    description: 'Plan and schedule your content',
    color: '#10B981',
  },
];

// ─── Page ───────────────────────────────────────────────────────────

export default function ContentForgeHub() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('writer');

  const handleTabClick = (tab: TabConfig) => {
    if (tab.href) {
      router.push(tab.href);
    } else {
      setActiveTab(tab.id);
    }
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A96E] to-[#8B5CF6] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </span>
          Content Forge
        </h1>
        <p className="text-white/50 text-sm mt-1 ml-[52px]">Your central hub for creating all types of content</p>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id && !tab.href;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'text-white shadow-lg'
                    : 'text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10'
                }`}
                style={isActive ? {
                  background: `linear-gradient(135deg, color-mix(in srgb, ${tab.color} 30%, transparent), color-mix(in srgb, ${tab.color} 15%, transparent))`,
                  border: `1px solid color-mix(in srgb, ${tab.color} 40%, transparent)`,
                  boxShadow: `0 4px 20px color-mix(in srgb, ${tab.color} 20%, transparent)`,
                } : {
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <span style={{ color: isActive ? tab.color : undefined }}>{tab.icon}</span>
                {tab.label}
                {tab.href && <ArrowRight className="w-3 h-3 ml-1 opacity-50" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'writer' && <ContentForge2 />}
          {activeTab === 'image' && <ImageGenerator />}
          {activeTab === 'calendar' && <ContentCalendarPlaceholder />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Content Calendar Placeholder ───────────────────────────────────

function ContentCalendarPlaceholder() {
  return (
    <div className="px-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
        <Calendar className="w-12 h-12 text-emerald-400/50 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Content Calendar</h3>
        <p className="text-white/50 text-sm max-w-md mx-auto">
          Plan and schedule your content across all channels. Drag and drop to reorganize your publishing timeline.
        </p>
        <p className="text-white/30 text-xs mt-4">Coming soon</p>
      </div>
    </div>
  );
}
