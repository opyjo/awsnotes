"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
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
    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-primary"
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
      <h2 className="text-2xl font-bold mb-2">AWS Cloud Architect AI Tutor</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        Ask me anything about AWS concepts, and I'll explain them in simple terms
        to help you pass your certification exam.
      </p>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-blue-50/50 via-background to-blue-100/30 dark:from-blue-950/30 dark:via-background dark:to-blue-900/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">AI Tutor</h1>
          <ModelSelector selectedModel={selectedModel} onModelChange={setModel} />
        </div>
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowClearDialog(true)}
          >
            Clear
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          welcomeMessage
        ) : (
          <div className="p-4 space-y-4">
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
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <ChatInput onSend={sendMessage} isLoading={isLoading} />

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
