'use client';

/**
 * ActionBar - ChatGPT-style Command Center Input Bar
 *
 * A floating bottom prompt bar with:
 * - Tool selector popover (Create Image, Blog Post, Social Loop, Deep Research)
 * - Dynamic text input with placeholder based on active tool
 * - "Forging" status indicator when processing
 * - Mic button for voice input
 * - Send button
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon, FileText, Share2, Search,
  Mic, MicOff, Send, Loader2, ChevronUp,
  Sparkles, X,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────

export interface ActionBarTool {
  id: string;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  color: string;
}

export interface ActionBarProps {
  /** Called when user submits a prompt with the active tool */
  onSubmit: (prompt: string, toolId: string) => void;
  /** Whether the bar is currently processing a request */
  isForging?: boolean;
  /** Custom status text while forging */
  forgingText?: string;
  /** Available tools (defaults to built-in set) */
  tools?: ActionBarTool[];
  /** Default active tool ID */
  defaultTool?: string;
  /** Additional class names */
  className?: string;
  /** Disable the input */
  disabled?: boolean;
}

// ─── Default Tools ──────────────────────────────────────────────────

const DEFAULT_TOOLS: ActionBarTool[] = [
  {
    id: 'image',
    label: 'Create Image',
    icon: <ImageIcon className="w-4 h-4" />,
    placeholder: 'Describe the image you want to create...',
    color: '#C9A96E',
  },
  {
    id: 'blog',
    label: 'Blog Post',
    icon: <FileText className="w-4 h-4" />,
    placeholder: 'What should the blog post be about?',
    color: '#8B5CF6',
  },
  {
    id: 'social',
    label: 'Social Loop',
    icon: <Share2 className="w-4 h-4" />,
    placeholder: 'Create a social media post about...',
    color: '#EC4899',
  },
  {
    id: 'research',
    label: 'Deep Research',
    icon: <Search className="w-4 h-4" />,
    placeholder: 'What would you like to research?',
    color: '#06B6D4',
  },
];

// ─── Component ──────────────────────────────────────────────────────

export default function ActionBar({
  onSubmit,
  isForging = false,
  forgingText = 'Forging...',
  tools = DEFAULT_TOOLS,
  defaultTool,
  className = '',
  disabled = false,
}: ActionBarProps) {
  const [prompt, setPrompt] = useState('');
  const [activeTool, setActiveTool] = useState<ActionBarTool>(
    tools.find(t => t.id === defaultTool) || tools[0]
  );
  const [showToolSelector, setShowToolSelector] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Close tool selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        setShowToolSelector(false);
      }
    };
    if (showToolSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showToolSelector]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [prompt]);

  const handleSubmit = useCallback(() => {
    if (!prompt.trim() || isForging || disabled) return;
    onSubmit(prompt.trim(), activeTool.id);
    setPrompt('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  }, [prompt, isForging, disabled, onSubmit, activeTool.id]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        // Attempt transcription via existing blog transcribe route
        try {
          const formData = new FormData();
          formData.append('audio', blob, 'recording.webm');
          const res = await fetch('/api/blog/transcribe', { method: 'POST', body: formData });
          if (res.ok) {
            const data = await res.json();
            if (data.text) {
              setPrompt(prev => prev + (prev ? ' ' : '') + data.text);
            }
          }
        } catch {
          // Silently fail - mic just won't transcribe
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      // Microphone permission denied
    }
  };

  const selectTool = (tool: ActionBarTool) => {
    setActiveTool(tool);
    setShowToolSelector(false);
    inputRef.current?.focus();
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.3 }}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 ${className}`}
    >
      <div className="relative">
        {/* Forging Status Indicator */}
        <AnimatePresence>
          {isForging && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full"
              style={{ background: `color-mix(in srgb, ${activeTool.color} 20%, #141419)`, border: `1px solid color-mix(in srgb, ${activeTool.color} 30%, transparent)` }}
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: activeTool.color }} />
              <span className="text-xs font-medium" style={{ color: activeTool.color }}>
                {forgingText}
              </span>
              <Sparkles className="w-3 h-3" style={{ color: activeTool.color }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tool Selector Popover */}
        <AnimatePresence>
          {showToolSelector && (
            <motion.div
              ref={selectorRef}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-2 left-0 w-64 rounded-xl bg-[#1A1A22]/98 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/60 overflow-hidden"
            >
              <div className="p-2">
                <p className="text-[10px] uppercase tracking-wider text-white/30 px-2 py-1 font-semibold">Select Tool</p>
                {tools.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => selectTool(tool)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                      activeTool.id === tool.id
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: activeTool.id === tool.id
                          ? `color-mix(in srgb, ${tool.color} 25%, transparent)`
                          : 'rgba(255,255,255,0.05)',
                        color: tool.color,
                      }}
                    >
                      {tool.icon}
                    </span>
                    <span className="font-medium">{tool.label}</span>
                    {activeTool.id === tool.id && (
                      <span className="ml-auto w-2 h-2 rounded-full" style={{ background: tool.color }} />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Input Bar */}
        <div
          className="flex items-end gap-2 px-3 py-2.5 rounded-2xl bg-[#141419]/95 backdrop-blur-xl border shadow-2xl shadow-black/50 transition-colors"
          style={{ borderColor: isForging ? `color-mix(in srgb, ${activeTool.color} 40%, transparent)` : 'rgba(255,255,255,0.1)' }}
        >
          {/* Tool Selector Button */}
          <button
            onClick={() => setShowToolSelector(!showToolSelector)}
            className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition hover:bg-white/5"
            style={{ color: activeTool.color }}
            title="Select tool"
          >
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `color-mix(in srgb, ${activeTool.color} 15%, transparent)` }}
            >
              {activeTool.icon}
            </span>
            <ChevronUp className={`w-3 h-3 transition-transform ${showToolSelector ? 'rotate-180' : ''}`} />
          </button>

          {/* Text Input */}
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask Greenline: ${activeTool.label}...`}
            disabled={isForging || disabled}
            rows={1}
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 resize-none outline-none py-1.5 min-h-[36px] max-h-[120px] disabled:opacity-40"
          />

          {/* Mic Button */}
          <button
            onClick={toggleRecording}
            disabled={isForging || disabled}
            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition ${
              isRecording
                ? 'bg-red-500/20 text-red-400 animate-pulse'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            } disabled:opacity-30`}
            title={isRecording ? 'Stop recording' : 'Voice input'}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Send Button */}
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isForging || disabled}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition disabled:opacity-30"
            style={{
              background: prompt.trim() && !isForging
                ? `linear-gradient(135deg, ${activeTool.color}, color-mix(in srgb, ${activeTool.color} 80%, #000))`
                : 'rgba(255,255,255,0.05)',
              color: prompt.trim() && !isForging ? '#000' : 'rgba(255,255,255,0.3)',
            }}
            title="Send"
          >
            {isForging ? (
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: activeTool.color }} />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
