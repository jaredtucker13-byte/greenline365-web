import { describe, it, expect } from 'vitest';
import { selectBestModel } from '@/lib/chat/model-selector';

describe('selectBestModel', () => {
  describe('image handling', () => {
    it('returns sonnet for image messages', () => {
      const config = selectBestModel('describe this photo', true);
      expect(config.primary).toBe('anthropic/claude-sonnet-4.6');
      expect(config.fallbacks).toContain('openai/gpt-4o');
    });

    it('prioritizes image over deep thinking keywords', () => {
      const config = selectBestModel('analyze this image comprehensively', true);
      expect(config.primary).toBe('anthropic/claude-sonnet-4.6');
    });
  });

  describe('deep thinking detection', () => {
    it('uses opus for "analyze" keyword', () => {
      const config = selectBestModel('analyze my business strategy');
      expect(config.primary).toBe('anthropic/claude-opus-4.6');
      expect(config.maxTokens).toBe(2000);
    });

    it('uses opus for "comprehensive" keyword', () => {
      const config = selectBestModel('give me a comprehensive review');
      expect(config.primary).toBe('anthropic/claude-opus-4.6');
    });

    it('uses opus for long messages (>200 chars)', () => {
      const longMsg = 'a'.repeat(201);
      const config = selectBestModel(longMsg);
      expect(config.primary).toBe('anthropic/claude-opus-4.6');
      expect(config.temperature).toBe(0.8);
    });
  });

  describe('coding detection', () => {
    it('uses opus for coding queries', () => {
      const config = selectBestModel('help me debug this function');
      expect(config.primary).toBe('anthropic/claude-opus-4.6');
      expect(config.temperature).toBe(0.5);
      expect(config.maxTokens).toBe(1500);
    });

    it('detects API-related queries as coding', () => {
      const config = selectBestModel('how do I call this api endpoint');
      expect(config.primary).toBe('anthropic/claude-opus-4.6');
    });
  });

  describe('context-aware selection', () => {
    it('uses sonnet for long conversations (>5 messages)', () => {
      const config = selectBestModel('tell me more', false, 6);
      expect(config.primary).toBe('anthropic/claude-sonnet-4.6');
      expect(config.fallbacks[0]).toBe('openai/gpt-4o');
    });

    it('detects "you said" as needing context', () => {
      const config = selectBestModel('you said something about pricing');
      expect(config.primary).toBe('anthropic/claude-sonnet-4.6');
    });
  });

  describe('complexity detection', () => {
    it('uses sonnet for explanatory queries', () => {
      const config = selectBestModel('explain how this works');
      expect(config.primary).toBe('anthropic/claude-sonnet-4.6');
      expect(config.maxTokens).toBe(800);
    });
  });

  describe('default (simple) queries', () => {
    it('returns sonnet with low token limit for simple messages', () => {
      const config = selectBestModel('hello');
      expect(config.primary).toBe('anthropic/claude-sonnet-4.6');
      expect(config.maxTokens).toBe(500);
      expect(config.temperature).toBe(0.7);
    });

    it('includes fallbacks', () => {
      const config = selectBestModel('hi');
      expect(config.fallbacks.length).toBeGreaterThan(0);
    });
  });
});
