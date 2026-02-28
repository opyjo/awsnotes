export type ModelProvider = "openai" | "anthropic" | "moonshot";

// OpenAI models
export type OpenAIModel =
  | "gpt-5.2"
  | "gpt-5.2-pro"
  | "gpt-5.1"
  | "gpt-5"
  | "gpt-5-mini"
  | "gpt-5-nano"
  | "gpt-4.1"
  | "gpt-4.1-mini"
  | "gpt-4.1-nano"
  | "o3-pro"
  | "o3"
  | "o4-mini"
  | "o1-pro"
  | "gpt-4o"
  | "gpt-4o-mini"
  | "gpt-4-turbo"
  | "gpt-4"
  | "gpt-3.5-turbo"
  | "o1"
  | "o1-mini"
  | "o1-preview";

// Anthropic models (Claude)
export type AnthropicModel =
  | "claude-opus-4-6"
  | "claude-sonnet-4-6"
  | "claude-haiku-4-5"
  | "claude-haiku-4-5-20251001"
  | "claude-opus-4-1-20250805"
  | "claude-opus-4-20250514"
  | "claude-sonnet-4-20250514"
  | "claude-3-7-sonnet-20250219"
  | "claude-3-5-haiku-20241022";

// Moonshot models (Kimi K2)
export type MoonshotModel =
  | "kimi-k2-0711-preview"
  | "kimi-k2-turbo-preview"
  | "kimi-k2-0905-preview"
  | "kimi-k2-thinking"
  | "kimi-k2-thinking-turbo";

export type ModelId = OpenAIModel | AnthropicModel | MoonshotModel;

export interface ModelConfig {
  id: ModelId;
  provider: ModelProvider;
  name: string;
  description: string;
}

export const DEFAULT_CHAT_MODEL: ModelId = "claude-sonnet-4-6";

export const AVAILABLE_MODELS: ModelConfig[] = [
  // OpenAI Models
  {
    id: "gpt-5.2",
    provider: "openai",
    name: "GPT-5.2",
    description: "Latest flagship model for coding and agentic tasks",
  },
  {
    id: "gpt-5.2-pro",
    provider: "openai",
    name: "GPT-5.2 Pro",
    description: "Highest precision GPT-5.2 variant",
  },
  {
    id: "gpt-5.1",
    provider: "openai",
    name: "GPT-5.1",
    description: "Strong reasoning with configurable effort",
  },
  {
    id: "gpt-5",
    provider: "openai",
    name: "GPT-5",
    description: "Previous GPT-5 flagship model",
  },
  {
    id: "gpt-5-mini",
    provider: "openai",
    name: "GPT-5 Mini",
    description: "Fast, cost-efficient GPT-5 model",
  },
  {
    id: "gpt-5-nano",
    provider: "openai",
    name: "GPT-5 Nano",
    description: "Fastest and lowest-cost GPT-5 model",
  },
  {
    id: "gpt-4.1",
    provider: "openai",
    name: "GPT-4.1",
    description: "Smartest non-reasoning GPT-4.1 model",
  },
  {
    id: "gpt-4.1-mini",
    provider: "openai",
    name: "GPT-4.1 Mini",
    description: "Smaller, faster GPT-4.1 variant",
  },
  {
    id: "gpt-4.1-nano",
    provider: "openai",
    name: "GPT-4.1 Nano",
    description: "Lowest-cost GPT-4.1 option",
  },
  {
    id: "o3-pro",
    provider: "openai",
    name: "o3 Pro",
    description: "Maximum-compute o3 reasoning model",
  },
  {
    id: "o3",
    provider: "openai",
    name: "o3",
    description: "Reasoning model for complex tasks",
  },
  {
    id: "o4-mini",
    provider: "openai",
    name: "o4 Mini",
    description: "Fast, affordable reasoning model",
  },
  {
    id: "o1-pro",
    provider: "openai",
    name: "o1 Pro",
    description: "Higher-compute version of o1",
  },
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
  // Anthropic Models (Claude)
  {
    id: "claude-opus-4-6",
    provider: "anthropic",
    name: "Claude Opus 4.6",
    description: "Latest flagship Claude model",
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
    description: "Fastest current Claude model",
  },
  {
    id: "claude-haiku-4-5-20251001",
    provider: "anthropic",
    name: "Claude Haiku 4.5 (Snapshot)",
    description: "Pinned Claude Haiku 4.5 snapshot",
  },
  {
    id: "claude-opus-4-1-20250805",
    provider: "anthropic",
    name: "Claude Opus 4.1",
    description: "Stable Claude Opus 4.1 snapshot",
  },
  {
    id: "claude-opus-4-20250514",
    provider: "anthropic",
    name: "Claude Opus 4",
    description: "Original Claude 4 Opus snapshot",
  },
  {
    id: "claude-sonnet-4-20250514",
    provider: "anthropic",
    name: "Claude Sonnet 4",
    description: "Original Claude 4 Sonnet snapshot",
  },
  {
    id: "claude-3-7-sonnet-20250219",
    provider: "anthropic",
    name: "Claude 3.7 Sonnet",
    description: "Hybrid reasoning Claude 3.7 model",
  },
  {
    id: "claude-3-5-haiku-20241022",
    provider: "anthropic",
    name: "Claude 3.5 Haiku",
    description: "Fast Claude 3.5 snapshot",
  },
  // Moonshot Models (Kimi K2)
  {
    id: "kimi-k2-0711-preview",
    provider: "moonshot",
    name: "Kimi K2",
    description: "Powerful open-source model",
  },
  {
    id: "kimi-k2-turbo-preview",
    provider: "moonshot",
    name: "Kimi K2 Turbo",
    description: "High-speed Kimi K2 variant",
  },
  {
    id: "kimi-k2-0905-preview",
    provider: "moonshot",
    name: "Kimi K2 (Sep)",
    description: "Latest Kimi K2 update",
  },
  {
    id: "kimi-k2-thinking",
    provider: "moonshot",
    name: "Kimi K2 Thinking",
    description: "Advanced reasoning model",
  },
  {
    id: "kimi-k2-thinking-turbo",
    provider: "moonshot",
    name: "Kimi K2 Thinking Turbo",
    description: "Fastest Kimi K2 reasoning model",
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
