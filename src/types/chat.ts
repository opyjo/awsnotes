export type ModelProvider = "openai" | "anthropic";

// OpenAI models
export type OpenAIModel = 
  | "gpt-4o"
  | "gpt-4o-mini"
  | "gpt-4-turbo"
  | "gpt-4"
  | "gpt-3.5-turbo"
  | "o1"
  | "o1-mini"
  | "o1-preview";

// Anthropic models (Claude 4.5)
export type AnthropicModel = 
  | "claude-sonnet-4-5-20250929"
  | "claude-haiku-4-5-20251001"
  | "claude-opus-4-5-20251101";

export type ModelId = OpenAIModel | AnthropicModel;

export interface ModelConfig {
  id: ModelId;
  provider: ModelProvider;
  name: string;
  description: string;
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  // OpenAI Models
  {
    id: "gpt-4o",
    provider: "openai",
    name: "GPT-4o",
    description: "Most capable OpenAI model",
  },
  {
    id: "gpt-4o-mini",
    provider: "openai",
    name: "GPT-4o Mini",
    description: "Fast and affordable",
  },
  {
    id: "gpt-4-turbo",
    provider: "openai",
    name: "GPT-4 Turbo",
    description: "Latest GPT-4 with vision",
  },
  {
    id: "gpt-4",
    provider: "openai",
    name: "GPT-4",
    description: "Original GPT-4",
  },
  {
    id: "gpt-3.5-turbo",
    provider: "openai",
    name: "GPT-3.5 Turbo",
    description: "Fast and cost-effective",
  },
  {
    id: "o1",
    provider: "openai",
    name: "o1",
    description: "Advanced reasoning model",
  },
  {
    id: "o1-mini",
    provider: "openai",
    name: "o1 Mini",
    description: "Fast reasoning model",
  },
  {
    id: "o1-preview",
    provider: "openai",
    name: "o1 Preview",
    description: "Preview reasoning model",
  },
  // Anthropic Models (Claude 4.5)
  {
    id: "claude-sonnet-4-5-20250929",
    provider: "anthropic",
    name: "Claude Sonnet 4.5",
    description: "Best balance of intelligence & speed",
  },
  {
    id: "claude-haiku-4-5-20251001",
    provider: "anthropic",
    name: "Claude Haiku 4.5",
    description: "Fastest with near-frontier intelligence",
  },
  {
    id: "claude-opus-4-5-20251101",
    provider: "anthropic",
    name: "Claude Opus 4.5",
    description: "Maximum intelligence",
  },
];

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  model?: ModelId;
}

export interface ChatState {
  messages: ChatMessage[];
  selectedModel: ModelId;
}
