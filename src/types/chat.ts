export type ModelProvider = "anthropic" | "moonshot";

// Anthropic models (Claude)
export type AnthropicModel =
  | "claude-fable-5"
  | "claude-opus-4-8"
  | "claude-sonnet-4-6"
  | "claude-haiku-4-5";

// Moonshot models (Kimi)
export type MoonshotModel =
  | "kimi-k2.7-code"
  | "kimi-k2.6"
  | "kimi-k2.5";

export type ModelId = AnthropicModel | MoonshotModel;

export interface ModelConfig {
  id: ModelId;
  provider: ModelProvider;
  name: string;
  description: string;
}

export const DEFAULT_CHAT_MODEL: ModelId = "kimi-k2.6";

export const AVAILABLE_MODELS: ModelConfig[] = [
  // Anthropic Models (Claude)
  {
    id: "claude-fable-5",
    provider: "anthropic",
    name: "Claude Fable 5",
    description: "Most capable Claude model, advanced reasoning",
  },
  {
    id: "claude-opus-4-8",
    provider: "anthropic",
    name: "Claude Opus 4.8",
    description: "Top Opus-tier for complex reasoning and agentic coding",
  },
  {
    id: "claude-sonnet-4-6",
    provider: "anthropic",
    name: "Claude Sonnet 4.6",
    description: "Best balance of speed and intelligence",
  },
  {
    id: "claude-haiku-4-5",
    provider: "anthropic",
    name: "Claude Haiku 4.5",
    description: "Fastest Claude model",
  },
  // Moonshot Models (Kimi)
  {
    id: "kimi-k2.7-code",
    provider: "moonshot",
    name: "Kimi K2.7 Code",
    description: "Latest coding-focused model, 1T MoE",
  },
  {
    id: "kimi-k2.6",
    provider: "moonshot",
    name: "Kimi K2.6",
    description: "Multimodal agentic model with long-horizon coding",
  },
  {
    id: "kimi-k2.5",
    provider: "moonshot",
    name: "Kimi K2.5",
    description: "Multimodal model with thinking and agent capabilities",
  },
];

const MODEL_IDS = new Set(AVAILABLE_MODELS.map((model) => model.id));

export const isModelId = (model: string): model is ModelId => MODEL_IDS.has(model as ModelId);

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
