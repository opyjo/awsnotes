"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ModelSelector } from "./ModelSelector";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useChat } from "@/hooks/useChat";
import { useToast } from "@/components/ui/toast";

export const ChatInterface = () => {
  const {
    messages,
    selectedModel,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    setModel,
  } = useChat();
  const { addToast } = useToast();
  const [showClearDialog, setShowClearDialog] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  React.useEffect(() => {
    if (error) {
      addToast({
        type: "error",
        message: error,
      });
    }
  }, [error, addToast]);

  const handleClear = () => {
    clearMessages();
    setShowClearDialog(false);
    addToast({
      type: "success",
      message: "Conversation cleared",
    });
  };

  const welcomeMessage = (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
        <svg
          className="h-7 w-7 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      </div>
      <h2 className="mb-2 text-2xl font-bold">Welcome to BrightByte Chat</h2>
      <p className="mb-6 max-w-xl text-sm text-muted-foreground sm:text-base">
        Ask AWS questions and get clear, exam-focused explanations tailored for
        fast learning.
      </p>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-start justify-between gap-3 px-3 py-3 sm:items-center sm:px-4 md:px-6">
          <div className="min-w-0">
            <h1 className="text-base font-semibold sm:text-lg">BrightByte Chat</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Get concise AWS explanations for faster exam prep.
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap sm:justify-end">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setModel}
              className="min-w-0 flex-1 sm:min-w-[220px] sm:flex-none"
            />
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearDialog(true)}
                className="h-9 px-2.5 sm:px-3"
                aria-label="Clear conversation"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span className="ml-1.5 hidden md:inline">Clear</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {messages.length === 0 ? (
          welcomeMessage
        ) : (
          <div className="mx-auto w-full max-w-4xl space-y-4 px-3 py-4 sm:px-4 md:px-6 md:py-5">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex gap-3 mb-6">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="chat-composer sticky bottom-0 z-10 shrink-0">
        <div className="mx-auto w-full max-w-4xl px-3 sm:px-4 md:px-6">
          <ChatInput onSend={sendMessage} isLoading={isLoading} showTopBorder={false} />
        </div>
      </div>

      <ConfirmDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
        title="Clear Conversation"
        description="Are you sure you want to clear this conversation? This action cannot be undone."
        confirmLabel="Clear"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleClear}
      />
    </div>
  );
};
