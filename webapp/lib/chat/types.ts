 export inface Message {
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

export interface ChatRequest {
  reply: string;
  modelUsed?: string;
  tokensUsed?: number;
}
