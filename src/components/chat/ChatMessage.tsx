"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNotes } from "@/context/NotesContext";
import { useToast } from "@/components/ui/toast";
import type { ChatMessage as ChatMessageType } from "@/types/chat";

interface ChatMessageProps {
  message: ChatMessageType;
  onSaveToNotes?: (content: string) => void;
}

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString();
};

const renderMarkdown = (content: string) => {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentParagraph: string[] = [];
  let inCodeBlock = false;
  let codeBlockLanguage = "";
  let codeBlockContent: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join("\n");
      if (text.trim()) {
        elements.push(
          <p key={elements.length} className="mb-2 last:mb-0">
            {renderInlineMarkdown(text)}
          </p>
        );
      }
      currentParagraph = [];
    }
  };

  const flushCodeBlock = () => {
    if (codeBlockContent.length > 0) {
      elements.push(
        <pre
          key={elements.length}
          className="bg-muted rounded-md p-4 overflow-x-auto mb-2 text-sm"
        >
          <code>{codeBlockContent.join("\n")}</code>
        </pre>
      );
      codeBlockContent = [];
      codeBlockLanguage = "";
    }
  };

  const renderInlineMarkdown = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Bold **text**
    const boldRegex = /\*\*(.+?)\*\*/g;
    let match;
    const matches: Array<{ start: number; end: number; text: string }> = [];

    while ((match = boldRegex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[1],
      });
    }

    // Code `code`
    const codeRegex = /`([^`]+)`/g;
    while ((match = codeRegex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[1],
        isCode: true,
      });
    }

    matches.sort((a, b) => a.start - b.start);

    for (const m of matches) {
      if (m.start > lastIndex) {
        parts.push(text.slice(lastIndex, m.start));
      }
      if ((m as any).isCode) {
        parts.push(
          <code
            key={lastIndex}
            className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
          >
            {m.text}
          </code>
        );
      } else {
        parts.push(<strong key={lastIndex}>{m.text}</strong>);
      }
      lastIndex = m.end;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? <>{parts}</> : text;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        flushParagraph();
        inCodeBlock = true;
        codeBlockLanguage = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      flushParagraph();
      const itemText = line.slice(2);
      elements.push(
        <li key={elements.length} className="mb-1 ml-4">
          {renderInlineMarkdown(itemText)}
        </li>
      );
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      flushParagraph();
      const itemText = line.replace(/^\d+\.\s/, "");
      elements.push(
        <li key={elements.length} className="mb-1 ml-4 list-decimal">
          {renderInlineMarkdown(itemText)}
        </li>
      );
      continue;
    }

    currentParagraph.push(line);
  }

  flushParagraph();
  flushCodeBlock();

  return elements.length > 0 ? <>{elements}</> : <p>{content}</p>;
};

export const ChatMessage = ({ message, onSaveToNotes }: ChatMessageProps) => {
  const { createNote } = useNotes();
  const { addToast } = useToast();
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [noteTitle, setNoteTitle] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  const isUser = message.role === "user";
  const modelBadge = message.model === "anthropic" ? "Claude" : message.model === "openai" ? "GPT-4" : null;

  const handleSaveToNotes = async () => {
    if (!noteTitle.trim()) return;

    setIsSaving(true);
    try {
      await createNote({
        title: noteTitle.trim(),
        content: message.content,
        tags: ["ai-chat", message.model || "openai"],
      });
      setSaveDialogOpen(false);
      setNoteTitle("");
      addToast({
        type: "success",
        message: "Note saved successfully!",
      });
      onSaveToNotes?.(message.content);
    } catch (error) {
      console.error("Failed to save note:", error);
      addToast({
        type: "error",
        message: "Failed to save note. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "flex gap-3 mb-6 animate-in fade-in slide-in-from-bottom-2",
          isUser ? "justify-end" : "justify-start"
        )}
      >
        {!isUser && (
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
        )}

        <div
          className={cn(
            "flex flex-col gap-1 max-w-[85%] md:max-w-[70%]",
            isUser && "items-end"
          )}
        >
          <div
            className={cn(
              "rounded-lg px-4 py-3",
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            )}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {renderMarkdown(message.content)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {modelBadge && (
              <span className="px-2 py-0.5 rounded-full bg-background border border-border text-xs">
                {modelBadge}
              </span>
            )}
            <span>{formatTimestamp(message.timestamp)}</span>
            {!isUser && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(message.content);
                  }}
                  className="hover:text-foreground transition-colors"
                  aria-label="Copy message"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setSaveDialogOpen(true)}
                  className="hover:text-foreground transition-colors"
                  aria-label="Save to notes"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {isUser && (
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        )}
      </div>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save to Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">Note Title</Label>
              <Input
                id="note-title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Enter a title for this note"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && noteTitle.trim()) {
                    e.preventDefault();
                    handleSaveToNotes();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveToNotes}
              disabled={!noteTitle.trim() || isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
