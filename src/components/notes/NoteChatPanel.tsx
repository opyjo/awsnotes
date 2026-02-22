"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useNoteChat } from "@/hooks/useNoteChat";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useNotes } from "@/hooks/api/useNotes";
import { markdownToHtml } from "@/lib/markdown-to-html";
import { cn } from "@/lib/utils";

interface NoteChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  noteTitle: string;
  noteContent: string;
}

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export const NoteChatPanel = ({
  isOpen,
  onClose,
  noteId,
  noteTitle,
  noteContent,
}: NoteChatPanelProps) => {
  const { messages, isLoading, error, sendMessage, clearMessages } = useNoteChat({
    noteId,
    noteTitle,
    noteContent,
  });
  const { updateNote } = useNotes();
  const { addToast } = useToast();
  const confirm = useConfirm();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isAppending, setIsAppending] = useState(false);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape key closes the modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Show error toast
  useEffect(() => {
    if (error) addToast({ type: "error", message: error });
  }, [error, addToast]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const textarea = inputRef.current;
      if (!textarea) return;
      const value = textarea.value.trim();
      if (!value || isLoading) return;
      textarea.value = "";
      textarea.style.height = "auto";
      await sendMessage(value);
    },
    [sendMessage, isLoading]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
    },
    [handleSubmit]
  );

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
  };

  const handleClear = async () => {
    const confirmed = await confirm({
      title: "Clear Conversation",
      description: "Are you sure you want to clear this conversation? This cannot be undone.",
      confirmLabel: "Clear",
      cancelLabel: "Cancel",
      variant: "destructive",
    });
    if (confirmed) clearMessages();
  };

  const handleAppendToNote = async () => {
    const confirmed = await confirm({
      title: "Add to Note",
      description: `This conversation will be appended to "${noteTitle}".`,
      confirmLabel: "Add to Note",
      cancelLabel: "Cancel",
    });
    if (!confirmed) return;

    setIsAppending(true);
    try {
      const date = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      // Build conversation HTML: blockquote for user, rendered markdown for AI
      const conversationHtml = messages
        .map((msg) => {
          if (msg.role === "user") {
            const escaped = escapeHtml(msg.content).replace(/\n/g, "<br>");
            return `<blockquote><strong>You:</strong> ${escaped}</blockquote>`;
          }
          return markdownToHtml(msg.content);
        })
        .join("");

      const sectionHtml = `<hr><h2>Chat Session · ${date}</h2>${conversationHtml}`;

      await updateNote(noteId, { content: noteContent + sectionHtml });
      addToast({ type: "success", message: "Conversation added to note!" });
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Failed to save",
        message: err?.message || "Could not append to note",
      });
    } finally {
      setIsAppending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="fixed inset-0 z-[71] flex items-center justify-center p-4 sm:p-8">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Chat about ${noteTitle}`}
          className={cn(
            "relative w-full max-w-3xl flex flex-col",
            "h-[85vh]",
            "rounded-2xl bg-background border border-border/60 shadow-2xl overflow-hidden",
            "animate-in fade-in zoom-in-95 duration-200"
          )}
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between gap-4 px-6 py-4 border-b border-border/60 bg-gradient-to-r from-primary/5 via-background to-background">
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 border border-primary/20">
                <svg className="w-[18px] h-[18px] text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-foreground leading-tight">
                  Chat with Note
                </h2>
                <p className="text-xs text-muted-foreground truncate max-w-[260px] sm:max-w-sm" title={noteTitle}>
                  {noteTitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {messages.length > 0 && (
                <>
                  {/* Add conversation to note */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleAppendToNote}
                    disabled={isAppending}
                    title="Add conversation to note"
                    aria-label="Add conversation to note"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  >
                    {isAppending ? (
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    )}
                  </Button>
                  {/* Clear conversation */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleClear}
                    title="Clear conversation"
                    aria-label="Clear conversation"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </>
              )}
              {/* Close */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close chat"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Context badge */}
          <div className="shrink-0 px-6 py-2 border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">
                AI has full context of this note
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-8 py-12 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="space-y-1.5">
                  <p className="text-base font-semibold text-foreground">
                    Ask me anything about this note
                  </p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    I&apos;ve read &ldquo;{noteTitle}&rdquo; and I&apos;m ready to explain,
                    summarize, or answer questions about it.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {["Summarize this note", "What are the key points?", "Explain this for the exam"].map(
                    (suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          if (inputRef.current) {
                            inputRef.current.value = suggestion;
                            inputRef.current.focus();
                          }
                        }}
                        className="text-xs px-3 py-1.5 rounded-full border border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border transition-colors"
                      >
                        {suggestion}
                      </button>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="px-6 pt-5 pb-2">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}

                {isLoading && (
                  <div className="flex gap-3 mb-6">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-1 px-4 py-3 rounded-xl bg-card border border-border rounded-bl-sm">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="shrink-0 border-t border-border/60 bg-background px-6 py-4">
            <form onSubmit={handleSubmit}>
              <div className="flex gap-3 items-end">
                <Textarea
                  ref={inputRef}
                  placeholder="Ask about this note…"
                  className="flex-1 min-h-[44px] max-h-[160px] resize-none text-sm leading-relaxed"
                  onKeyDown={handleKeyDown}
                  onInput={handleInput}
                  rows={1}
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading}
                  className="h-11 w-11 shrink-0 rounded-xl"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span className="sr-only">Send</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Enter to send &middot; Shift+Enter for new line
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
