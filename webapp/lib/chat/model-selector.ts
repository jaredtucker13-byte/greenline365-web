export interface ModelConfig {
  primary: string;
  fallbacks: string[];
  temperature: number;
  maxTokens: number;
}

export function selectBestModel(
  message: string,
  hasImage: boolean = false,
  conversationLength: number = 0
): ModelConfig {
  
  if (hasImage) {
    return {
      primary: 'anthropic/claude-4.5-sonnet',
      fallbacks: ['openai/gpt-5-image', 'openai/gpt-4.1'],
      temperature: 0.7,
      maxTokens: 1000
    };
  }
  
  const isDeepThinking = /analyze|strategy|research|compare deeply|evaluate|comprehensive/i.test(message);
  const isLongMessage = message.length > 200;
  
  if (isDeepThinking || isLongMessage) {
    return {
      primary: 'openai/gpt-5.2-pro',
      fallbacks: ['openai/o3-deep-research', 'anthropic/claude-4.5-sonnet'],
      temperature: 0.8,
      maxTokens: 2000
    };
  }
  
  const isCoding = /code|debug|refactor|function|implement|programming|software|api/i.test(message);
  if (isCoding) {
    return {
      primary: 'openai/gpt-5.1-codex-max',
      fallbacks: ['openai/gpt-5.2', 'anthropic/claude-4-sonnet'],
      temperature: 0.5,
      maxTokens: 1500
    };
  }
  
  const needsContext = conversationLength > 5 || /earlier|you said|we discussed|previously/i.test(message);
  if (needsContext) {
    return {
      primary: 'openai/gpt-5.2',
      fallbacks: ['anthropic/claude-4.5-sonnet', 'openai/gpt-4.1'],
      temperature: 0.7,
      maxTokens: 1000
    };
  }
  
  const isComplex = message.length > 100 || /explain|how does|why|detailed|tell me about/i.test(message);
  if (isComplex) {
    return {
      primary: 'openai/gpt-5.2',
      fallbacks: ['openai/gpt-5.2-chat', 'anthropic/claude-4.5-sonnet'],
      temperature: 0.7,
      maxTokens: 800
    };
  }
  
  return {
    primary: 'openai/gpt-5.2-chat',
    fallbacks: ['openai/gpt-5-mini', 'openai/gpt-4.1-nano'],
    temperature: 0.7,
    maxTokens: 500
  };
}