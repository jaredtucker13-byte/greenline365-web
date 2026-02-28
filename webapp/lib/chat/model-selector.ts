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
      primary: 'anthropic/claude-sonnet-4.6',
      fallbacks: ['openai/gpt-4o', 'google/gemini-2.5-pro-preview'],
      temperature: 0.7,
      maxTokens: 1000
    };
  }

  const isDeepThinking = /analyze|strategy|research|compare deeply|evaluate|comprehensive/i.test(message);
  const isLongMessage = message.length > 200;

  if (isDeepThinking || isLongMessage) {
    return {
      primary: 'anthropic/claude-opus-4',
      fallbacks: ['anthropic/claude-sonnet-4.6', 'openai/gpt-4o'],
      temperature: 0.8,
      maxTokens: 2000
    };
  }

  const isCoding = /code|debug|refactor|function|implement|programming|software|api/i.test(message);
  if (isCoding) {
    return {
      primary: 'anthropic/claude-sonnet-4.6',
      fallbacks: ['openai/gpt-4o', 'anthropic/claude-opus-4'],
      temperature: 0.5,
      maxTokens: 1500
    };
  }

  const needsContext = conversationLength > 5 || /earlier|you said|we discussed|previously/i.test(message);
  if (needsContext) {
    return {
      primary: 'anthropic/claude-opus-4',
      fallbacks: ['anthropic/claude-sonnet-4.6', 'openai/gpt-4o'],
      temperature: 0.7,
      maxTokens: 1000
    };
  }

  const isComplex = message.length > 100 || /explain|how does|why|detailed|tell me about/i.test(message);
  if (isComplex) {
    return {
      primary: 'anthropic/claude-sonnet-4.6',
      fallbacks: ['openai/gpt-4o', 'openai/gpt-4o-mini'],
      temperature: 0.7,
      maxTokens: 800
    };
  }

  return {
    primary: 'openai/gpt-4o-mini',
    fallbacks: ['anthropic/claude-sonnet-4.6', 'openai/gpt-4o'],
    temperature: 0.7,
    maxTokens: 500
  };
}
