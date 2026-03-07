'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Mic, MicOff, Paperclip, Image, ChevronDown,
  Send, Loader2, X, Type, Palette, Target, Volume2,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────

export interface InputBarOptions {
  tone?: string;
  audience?: string;
  format?: string;
  length?: 'short' | 'medium' | 'long';
  style?: string;
}

export interface EnhancedInputBarProps {
  /** Current value of the main input */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Callback when user submits */
  onSubmit: (value: string, options: InputBarOptions) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether generation is in progress */
  isLoading?: boolean;
  /** Loading label */
  loadingText?: string;
  /** Submit button label */
  submitLabel?: string;
  /** Submit button icon */
  submitIcon?: React.ReactNode;
  /** Show tone selector */
  showTone?: boolean;
  /** Show audience input */
  showAudience?: boolean;
  /** Show format/output selector */
  showFormat?: boolean;
  /** Show length selector */
  showLength?: boolean;
  /** Show style selector */
  showStyle?: boolean;
  /** Show attachment button */
  showAttach?: boolean;
  /** Show voice input button */
  showVoice?: boolean;
  /** Custom tone options */
  toneOptions?: { value: string; label: string }[];
  /** Custom format options */
  formatOptions?: { value: string; label: string }[];
  /** Custom style options */
  styleOptions?: { value: string; label: string }[];
  /** Callback when file attached */
  onAttach?: (files: File[]) => void;
  /** Extra actions to render in the toolbar */
  extraActions?: React.ReactNode;
  /** Whether to use multiline (textarea) */
  multiline?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
  /** Default option values */
  defaultOptions?: Partial<InputBarOptions>;
}

// ─── Defaults ───────────────────────────────────────────────────────

const DEFAULT_TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual & Friendly' },
  { value: 'bold', label: 'Bold & Contrarian' },
  { value: 'empathetic', label: 'Empathetic' },
  { value: 'witty', label: 'Witty & Playful' },
  { value: 'authoritative', label: 'Authoritative' },
];

const DEFAULT_FORMATS = [
  { value: 'blog', label: 'Blog Post' },
  { value: 'social', label: 'Social Media' },
  { value: 'email', label: 'Email' },
  { value: 'ad', label: 'Ad Copy' },
  { value: 'caption', label: 'Caption' },
  { value: 'script', label: 'Script' },
];

const DEFAULT_STYLES = [
  { value: 'modern', label: 'Modern' },
  { value: 'classic', label: 'Classic' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'vibrant', label: 'Vibrant' },
  { value: 'editorial', label: 'Editorial' },
];

const LENGTH_OPTIONS = [
  { value: 'short' as const, label: 'Short', desc: '~100 words' },
  { value: 'medium' as const, label: 'Medium', desc: '~300 words' },
  { value: 'long' as const, label: 'Long', desc: '~800+ words' },
];

// ─── Component ──────────────────────────────────────────────────────

export default function EnhancedInputBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Describe what you want to create...',
  isLoading = false,
  loadingText = 'Generating...',
  submitLabel = 'Generate',
  submitIcon,
  showTone = false,
  showAudience = false,
  showFormat = false,
  showLength = false,
  showStyle = false,
  showAttach = false,
  showVoice = false,
  toneOptions = DEFAULT_TONES,
  formatOptions = DEFAULT_FORMATS,
  styleOptions = DEFAULT_STYLES,
  onAttach,
  extraActions,
  multiline = false,
  disabled = false,
  className = '',
  defaultOptions = {},
}: EnhancedInputBarProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<InputBarOptions>({
    tone: defaultOptions.tone || 'professional',
    audience: defaultOptions.audience || '',
    format: defaultOptions.format || '',
    length: defaultOptions.length || 'medium',
    style: defaultOptions.style || '',
  });
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const activeOptionsCount = [
    showTone && options.tone !== 'professional',
    showAudience && options.audience,
    showFormat && options.format,
    showLength && options.length !== 'medium',
    showStyle && options.style,
  ].filter(Boolean).length;

  const handleSubmit = useCallback(() => {
    if (!value.trim() || isLoading || disabled) return;
    onSubmit(value, options);
  }, [value, options, isLoading, disabled, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !multiline) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && multiline) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit, multiline]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onAttach) {
      onAttach(files);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        // Transcription would go through an API endpoint
        // For now, append a placeholder
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
          if (res.ok) {
            const data = await res.json();
            if (data.text) {
              onChange(value ? `${value} ${data.text}` : data.text);
            }
          }
        } catch {
          // Silently fail - transcription is optional
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      // Microphone not available
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const updateOption = <K extends keyof InputBarOptions>(key: K, val: InputBarOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 overflow-hidden ${className}`}>
      {/* Main Input Area */}
      <div className="relative">
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={3}
            className="w-full px-4 py-3 bg-transparent text-white text-sm placeholder:text-white/30 focus:outline-none resize-none disabled:opacity-50"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className="w-full px-4 py-3 bg-transparent text-white text-sm placeholder:text-white/30 focus:outline-none disabled:opacity-50"
          />
        )}
      </div>

      {/* Toolbar Row */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-white/5 bg-white/[0.02]">
        {/* Left: Options & Attachments */}
        <div className="flex items-center gap-1">
          {/* Options Toggle */}
          {(showTone || showAudience || showFormat || showLength || showStyle) && (
            <button
              onClick={() => setShowOptions(!showOptions)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showOptions
                  ? 'bg-[#C9A96E]/20 text-[#C9A96E] border border-[#C9A96E]/30'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${showOptions ? 'rotate-180' : ''}`} />
              Options
              {activeOptionsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#C9A96E] text-black text-[10px] flex items-center justify-center font-bold">
                  {activeOptionsCount}
                </span>
              )}
            </button>
          )}

          {/* Attach */}
          {showAttach && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Voice */}
          {showVoice && (
            <button
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              className={`p-1.5 rounded-lg transition ${
                isRecording
                  ? 'text-red-400 bg-red-500/20 animate-pulse'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
              title={isRecording ? 'Stop recording' : 'Voice input'}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}

          {/* Extra Actions */}
          {extraActions}
        </div>

        {/* Right: Submit */}
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading || disabled}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#C9A96E] to-[#B8934A] text-black text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {loadingText}
            </>
          ) : (
            <>
              {submitIcon || <Sparkles className="w-3.5 h-3.5" />}
              {submitLabel}
            </>
          )}
        </button>
      </div>

      {/* Expandable Options Panel */}
      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 border-t border-white/5 bg-white/[0.02] space-y-3">
              {/* Tone */}
              {showTone && (
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] text-white/50 uppercase tracking-wider mb-1.5">
                    <Volume2 className="w-3 h-3" />
                    Tone
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {toneOptions.map(t => (
                      <button
                        key={t.value}
                        onClick={() => updateOption('tone', t.value)}
                        className={`px-2.5 py-1 rounded-lg text-xs transition ${
                          options.tone === t.value
                            ? 'bg-[#C9A96E]/20 text-[#C9A96E] border border-[#C9A96E]/30'
                            : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Audience */}
              {showAudience && (
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] text-white/50 uppercase tracking-wider mb-1.5">
                    <Target className="w-3 h-3" />
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={options.audience || ''}
                    onChange={(e) => updateOption('audience', e.target.value)}
                    placeholder="e.g., Local business owners, Healthcare professionals"
                    className="w-full px-3 py-1.5 bg-black/20 border border-white/10 rounded-lg text-white text-xs placeholder:text-white/25 focus:border-[#C9A96E]/50 focus:outline-none"
                  />
                </div>
              )}

              {/* Format */}
              {showFormat && (
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] text-white/50 uppercase tracking-wider mb-1.5">
                    <Type className="w-3 h-3" />
                    Output Format
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {formatOptions.map(f => (
                      <button
                        key={f.value}
                        onClick={() => updateOption('format', f.value)}
                        className={`px-2.5 py-1 rounded-lg text-xs transition ${
                          options.format === f.value
                            ? 'bg-[#C9A96E]/20 text-[#C9A96E] border border-[#C9A96E]/30'
                            : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Length */}
              {showLength && (
                <div>
                  <label className="text-[10px] text-white/50 uppercase tracking-wider mb-1.5 block">
                    Content Length
                  </label>
                  <div className="flex gap-2">
                    {LENGTH_OPTIONS.map(l => (
                      <button
                        key={l.value}
                        onClick={() => updateOption('length', l.value)}
                        className={`flex-1 py-1.5 rounded-lg text-xs text-center transition ${
                          options.length === l.value
                            ? 'bg-[#C9A96E]/20 text-[#C9A96E] border border-[#C9A96E]/30'
                            : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'
                        }`}
                      >
                        <span className="block font-medium">{l.label}</span>
                        <span className="block text-[10px] opacity-60">{l.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Style */}
              {showStyle && (
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] text-white/50 uppercase tracking-wider mb-1.5">
                    <Palette className="w-3 h-3" />
                    Visual Style
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {styleOptions.map(s => (
                      <button
                        key={s.value}
                        onClick={() => updateOption('style', s.value)}
                        className={`px-2.5 py-1 rounded-lg text-xs transition ${
                          options.style === s.value
                            ? 'bg-[#C9A96E]/20 text-[#C9A96E] border border-[#C9A96E]/30'
                            : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/20'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
