"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  suggestedQuestions?: string[];
  compactSuggestedQuestions?: boolean;
  suggestedQuestionLimit?: number;
  showTopBorder?: boolean;
}

export const ChatInput = ({
  onSend,
  isLoading,
  suggestedQuestions = [
    "What's the difference between S3 and EBS?",
    "Explain VPC in simple terms",
    "How does Auto Scaling work?",
    "What are the differences between SQS and SNS?",
  ],
  compactSuggestedQuestions = true,
  suggestedQuestionLimit = 3,
  showTopBorder = true,
}: ChatInputProps) => {
  const [input, setInput] = React.useState("");
  const [showAllSuggestions, setShowAllSuggestions] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (input.length > 0) {
      setShowAllSuggestions(false);
    }
  }, [input.length]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput("");
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestedClick = (question: string) => {
    setInput(question);
    textareaRef.current?.focus();
  };

  const shouldShowSuggestions = suggestedQuestions.length > 0 && input.length === 0;
  const canToggleSuggestions =
    compactSuggestedQuestions && suggestedQuestions.length > suggestedQuestionLimit;
  const visibleSuggestions =
    canToggleSuggestions && !showAllSuggestions
      ? suggestedQuestions.slice(0, suggestedQuestionLimit)
      : suggestedQuestions;

  return (
    <div
      className={cn(
        "bg-background/95",
        showTopBorder && "border-t border-border/60"
      )}
    >
      {shouldShowSuggestions && (
        <div className="border-b border-border/60 px-3 pb-2 pt-3 sm:px-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Quick Prompts
            </p>
            {canToggleSuggestions && (
              <button
                type="button"
                onClick={() => setShowAllSuggestions((prev) => !prev)}
                className="text-xs font-medium text-primary hover:underline"
              >
                {showAllSuggestions ? "Less" : "More"}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {visibleSuggestions.map((question, index) => (
              <button
                key={`${question}-${index}`}
                type="button"
                onClick={() => handleSuggestedClick(question)}
                className="max-w-full rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                title={question}
              >
                <span className="block truncate">{question}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about AWS concepts..."
              disabled={isLoading}
              rows={1}
              className="resize-none min-h-[40px] max-h-[112px] text-sm leading-relaxed"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 112)}px`;
              }}
            />
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[40px] w-[40px] flex-shrink-0"
            aria-label="Send message"
          >
            {isLoading ? (
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
};
