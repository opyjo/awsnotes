"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { ModelProvider } from "@/types/chat";

interface ModelSelectorProps {
  selectedModel: ModelProvider;
  onModelChange: (model: ModelProvider) => void;
  className?: string;
}

export const ModelSelector = ({
  selectedModel,
  onModelChange,
  className,
}: ModelSelectorProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const models: Array<{ value: ModelProvider; label: string; icon: React.ReactNode }> = [
    {
      value: "openai",
      label: "GPT-4",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
    },
    {
      value: "anthropic",
      label: "Claude 3.5",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
  ];

  const selected = models.find((m) => m.value === selectedModel) || models[0];

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

  return (
    <div className={cn("relative model-selector", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "transition-colors"
        )}
        aria-label="Select AI model"
        aria-expanded={isOpen}
      >
        <span className="text-muted-foreground">{selected.icon}</span>
        <span className="font-medium">{selected.label}</span>
        <svg
          className={cn(
            "w-4 h-4 transition-transform",
            isOpen && "rotate-180"
          )}
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
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-1 z-20 w-full rounded-md border border-input bg-background shadow-lg">
            {models.map((model) => (
              <button
                key={model.value}
                type="button"
                onClick={() => {
                  onModelChange(model.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm text-left",
                  "hover:bg-accent hover:text-accent-foreground",
                  "transition-colors",
                  selectedModel === model.value && "bg-accent text-accent-foreground"
                )}
              >
                <span className="text-muted-foreground">{model.icon}</span>
                <span>{model.label}</span>
                {selectedModel === model.value && (
                  <svg
                    className="w-4 h-4 ml-auto text-primary"
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
            ))}
          </div>
        </>
      )}
    </div>
  );
};
