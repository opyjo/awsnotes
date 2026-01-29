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
import { useAuth } from "@/context/AuthContext";
import { NotesProvider } from "@/context/NotesContext";

export const ChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);
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

  const isAuthenticated = !!user;

  React.useEffect(() => {
    if (isOpen && !isMinimized && isAuthenticated) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen, isMinimized, isAuthenticated]);

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

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
  };

  return (
    <NotesProvider>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 safe-area-bottom">
        {isOpen && (
          <div
            className={cn(
              "bg-background border border-border rounded-lg shadow-2xl flex flex-col",
              "transition-all duration-300 ease-in-out",
              isMinimized
                ? "w-80 h-16"
                : "w-[calc(100vw-2rem)] sm:w-[400px] h-[600px] md:h-[650px] max-w-[450px]"
            )}
          >
            {!user ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
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
                <h3 className="text-lg font-semibold mb-2">Sign in to use AI Tutor</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get instant answers to your AWS questions
                </p>
                <div className="flex gap-2">
                  <Button asChild size="sm">
                    <a href="/login">Sign In</a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a href="/register">Sign Up</a>
                  </Button>
                </div>
              </div>
            ) : isMinimized ? (
              <div className="flex items-center justify-between p-4 h-full">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium">AI Tutor</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleMaximize}
                  className="h-8 w-8"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
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
                    <div>
                      <h3 className="text-sm font-semibold">AWS AI Tutor</h3>
                      <p className="text-xs text-muted-foreground">Ask me anything</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ModelSelector
                      selectedModel={selectedModel}
                      onModelChange={setModel}
                      className="hidden sm:block"
                    />
                    {messages.length > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowClearDialog(true)}
                        className="h-8 w-8"
                      >
                        <svg
                          className="w-4 h-4"
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
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleMinimize}
                      className="h-8 w-8"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 12H4"
                        />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleOpen}
                      className="h-8 w-8"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        <svg
                          className="w-6 h-6 text-primary"
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
                      <h4 className="text-sm font-semibold mb-1">AWS Cloud Architect AI Tutor</h4>
                      <p className="text-xs text-muted-foreground mb-4">
                        Ask me anything about AWS concepts
                      </p>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>

                <ChatInput onSend={sendMessage} isLoading={isLoading} />
              </>
            )}
          </div>
        )}

        <Button
          onClick={toggleOpen}
          size="lg"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200",
            "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
            isOpen && "rotate-90"
          )}
          aria-label="Open AI Tutor"
        >
          {isOpen ? (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
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
          )}
        </Button>

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
    </NotesProvider>
  );
};
