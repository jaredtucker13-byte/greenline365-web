export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: Message[];
  hasImage?: boolean;
  imageData?: string;
  visitorId?: string;
}

export interface ChatResponse {
  reply: string;
  modelUsed?: string;
  tokensUsed?: number;
}
