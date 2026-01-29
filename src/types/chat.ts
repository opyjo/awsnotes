export type ModelProvider = "openai" | "anthropic";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  model?: ModelProvider;
}

export interface ChatState {
  messages: ChatMessage[];
  selectedModel: ModelProvider;
}
