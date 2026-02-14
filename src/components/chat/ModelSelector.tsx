"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AVAILABLE_MODELS, type ModelId, type ModelConfig } from "@/types/chat";

interface ModelSelectorProps {
  selectedModel: ModelId;
  onModelChange: (model: ModelId) => void;
  className?: string;
}

const OpenAIIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
    />
  </svg>
);

const AnthropicIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);

const MoonshotIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);

export const ModelSelector = ({
  selectedModel,
  onModelChange,
  className,
}: ModelSelectorProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const openaiModels = AVAILABLE_MODELS.filter((m) => m.provider === "openai");
  const anthropicModels = AVAILABLE_MODELS.filter((m) => m.provider === "anthropic");
  const moonshotModels = AVAILABLE_MODELS.filter((m) => m.provider === "moonshot");

  const selectedModelConfig = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".model-selector")) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const renderModelItem = (model: ModelConfig) => (
    <button
      key={model.id}
      type="button"
      onClick={() => {
        onModelChange(model.id);
        setIsOpen(false);
      }}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2 text-sm text-left",
        "hover:bg-accent hover:text-accent-foreground",
        "transition-colors cursor-pointer",
        selectedModel === model.id && "bg-accent text-accent-foreground"
      )}
    >
      <span className="text-muted-foreground">
        {model.provider === "openai" ? <OpenAIIcon /> : model.provider === "moonshot" ? <MoonshotIcon /> : <AnthropicIcon />}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{model.name}</div>
        <div className="text-xs text-muted-foreground truncate">{model.description}</div>
      </div>
      {selectedModel === model.id && (
        <svg
          className="w-4 h-4 flex-shrink-0 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
    </button>
  );

  return (
    <div className={cn("relative model-selector", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "transition-colors cursor-pointer"
        )}
        aria-label="Select AI model"
        aria-expanded={isOpen}
      >
        <span className="text-muted-foreground">
          {selectedModelConfig.provider === "openai" ? <OpenAIIcon /> : selectedModelConfig.provider === "moonshot" ? <MoonshotIcon /> : <AnthropicIcon />}
        </span>
        <span className="font-medium">{selectedModelConfig.name}</span>
        <svg
          className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-1 z-20 w-72 max-h-96 overflow-y-auto rounded-md border border-input bg-background shadow-lg">
            <div className="px-3 py-2 border-b border-border">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <OpenAIIcon />
                OpenAI
              </div>
            </div>
            {openaiModels.map(renderModelItem)}

            <div className="px-3 py-2 border-b border-t border-border">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <AnthropicIcon />
                Anthropic
              </div>
            </div>
            {anthropicModels.map(renderModelItem)}

            <div className="px-3 py-2 border-b border-t border-border">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <MoonshotIcon />
                Moonshot (Kimi K2)
              </div>
            </div>
            {moonshotModels.map(renderModelItem)}
          </div>
        </>
      )}
    </div>
  );
};
