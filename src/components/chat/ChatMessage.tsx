"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNotes } from "@/context/NotesContext";
import { useToast } from "@/components/ui/toast";
import { AVAILABLE_MODELS, type ChatMessage as ChatMessageType } from "@/types/chat";
import { markdownToHtml } from "@/lib/markdown-to-html";

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

const renderInlineMarkdown = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // Bold **text**
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      parts.push(<strong key={keyIndex++} className="font-semibold">{renderInlineMarkdown(boldMatch[1])}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic *text* or _text_
    const italicMatch = remaining.match(/^\*([^*]+)\*/) || remaining.match(/^_([^_]+)_/);
    if (italicMatch) {
      parts.push(<em key={keyIndex++}>{renderInlineMarkdown(italicMatch[1])}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Inline code `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(
        <code
          key={keyIndex++}
          className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Link [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      parts.push(
        <a
          key={keyIndex++}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:no-underline"
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Plain text character
    parts.push(remaining[0]);
    remaining = remaining.slice(1);
  }

  // Merge consecutive strings
  const merged: React.ReactNode[] = [];
  let currentString = "";
  for (const part of parts) {
    if (typeof part === "string") {
      currentString += part;
    } else {
      if (currentString) {
        merged.push(currentString);
        currentString = "";
      }
      merged.push(part);
    }
  }
  if (currentString) {
    merged.push(currentString);
  }

  return merged.length === 1 ? merged[0] : <>{merged}</>;
};

const parseTable = (lines: string[], startIndex: number): { table: React.ReactNode; endIndex: number } | null => {
  const tableLines: string[] = [];
  let i = startIndex;

  // Collect all table lines
  while (i < lines.length && lines[i].includes("|")) {
    tableLines.push(lines[i]);
    i++;
  }

  if (tableLines.length < 2) return null;

  // Check for separator line
  const separatorIndex = tableLines.findIndex(line => /^\|?[\s-:|]+\|?$/.test(line.trim()));
  if (separatorIndex === -1) return null;

  const parseRow = (line: string): string[] => {
    return line
      .split("|")
      .map(cell => cell.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1 || (arr.length === 2 && idx === 0));
  };

  const headerRow = parseRow(tableLines[0]);
  const bodyRows = tableLines.slice(separatorIndex + 1).map(parseRow);

  const table = (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-collapse text-xs">
        <thead>
          <tr className="border-b-2 border-border">
            {headerRow.map((cell, idx) => (
              <th key={idx} className="px-3 py-2 text-left font-semibold bg-muted/50">
                {renderInlineMarkdown(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, rowIdx) => (
            <tr key={rowIdx} className="border-b border-border hover:bg-muted/30 transition-colors">
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-3 py-2">
                  {renderInlineMarkdown(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return { table, endIndex: i - 1 };
};

const renderMarkdown = (content: string) => {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let listItems: { type: "ul" | "ol"; items: React.ReactNode[] } | null = null;
  let i = 0;

  const flushList = () => {
    if (listItems && listItems.items.length > 0) {
      if (listItems.type === "ul") {
        elements.push(
          <ul key={elements.length} className="list-disc list-outside ml-6 my-3 space-y-1">
            {listItems.items}
          </ul>
        );
      } else {
        elements.push(
          <ol key={elements.length} className="list-decimal list-outside ml-6 my-3 space-y-1">
            {listItems.items}
          </ol>
        );
      }
      listItems = null;
    }
  };

  const flushCodeBlock = () => {
    if (codeBlockContent.length > 0) {
      elements.push(
        <pre
          key={elements.length}
          className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto my-4 text-xs font-mono"
        >
          <code>{codeBlockContent.join("\n")}</code>
        </pre>
      );
      codeBlockContent = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      i++;
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      flushList();
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}\s*$/.test(line)) {
      flushList();
      elements.push(<hr key={elements.length} className="my-6 border-border" />);
      i++;
      continue;
    }

    // Headers
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      flushList();
      const level = headerMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      const text = headerMatch[2];
      const headerClasses: Record<number, string> = {
        1: "text-lg font-bold mt-4 mb-3 text-foreground",
        2: "text-base font-bold mt-3 mb-2 text-foreground border-b border-border pb-1",
        3: "text-sm font-semibold mt-3 mb-2 text-foreground",
        4: "text-sm font-semibold mt-2 mb-1 text-foreground",
        5: "text-xs font-semibold mt-2 mb-1 text-foreground",
        6: "text-xs font-medium mt-2 mb-1 text-muted-foreground",
      };
      const className = headerClasses[level];
      elements.push(
        level === 1 ? <h1 key={elements.length} className={className}>{renderInlineMarkdown(text)}</h1> :
        level === 2 ? <h2 key={elements.length} className={className}>{renderInlineMarkdown(text)}</h2> :
        level === 3 ? <h3 key={elements.length} className={className}>{renderInlineMarkdown(text)}</h3> :
        level === 4 ? <h4 key={elements.length} className={className}>{renderInlineMarkdown(text)}</h4> :
        level === 5 ? <h5 key={elements.length} className={className}>{renderInlineMarkdown(text)}</h5> :
        <h6 key={elements.length} className={className}>{renderInlineMarkdown(text)}</h6>
      );
      i++;
      continue;
    }

    // Table
    if (line.includes("|")) {
      flushList();
      const tableResult = parseTable(lines, i);
      if (tableResult) {
        elements.push(<React.Fragment key={elements.length}>{tableResult.table}</React.Fragment>);
        i = tableResult.endIndex + 1;
        continue;
      }
    }

    // Unordered list
    const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
    if (ulMatch) {
      const indent = ulMatch[1].length;
      const text = ulMatch[2];
      if (!listItems || listItems.type !== "ul") {
        flushList();
        listItems = { type: "ul", items: [] };
      }
      listItems.items.push(
        <li key={listItems.items.length} className={cn(indent > 0 && "ml-4")}>
          {renderInlineMarkdown(text)}
        </li>
      );
      i++;
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
    if (olMatch) {
      const indent = olMatch[1].length;
      const text = olMatch[2];
      if (!listItems || listItems.type !== "ol") {
        flushList();
        listItems = { type: "ol", items: [] };
      }
      listItems.items.push(
        <li key={listItems.items.length} className={cn(indent > 0 && "ml-4")}>
          {renderInlineMarkdown(text)}
        </li>
      );
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith(">")) {
      flushList();
      const quoteText = line.replace(/^>\s?/, "");
      elements.push(
        <blockquote
          key={elements.length}
          className="border-l-4 border-primary/50 pl-4 my-3 italic text-muted-foreground text-sm"
        >
          {renderInlineMarkdown(quoteText)}
        </blockquote>
      );
      i++;
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={elements.length} className="my-2 leading-relaxed text-sm">
        {renderInlineMarkdown(line)}
      </p>
    );
    i++;
  }

  flushList();
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
  const modelConfig = message.model ? AVAILABLE_MODELS.find((m) => m.id === message.model) : null;
  const modelBadge = modelConfig?.name || null;

  const handleSaveToNotes = async () => {
    if (!noteTitle.trim()) return;

    setIsSaving(true);
    try {
      // Convert markdown to HTML for TipTap editor
      const htmlContent = markdownToHtml(message.content);
      
      await createNote({
        title: noteTitle.trim(),
        content: htmlContent,
        tags: ["ai-chat", message.model || "gpt-4o"],
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
            "flex flex-col gap-1 max-w-[90%] md:max-w-[80%]",
            isUser && "items-end"
          )}
        >
          <div
            className={cn(
              "rounded-xl px-4 py-3 shadow-sm",
              isUser
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-card border border-border rounded-bl-sm"
            )}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
            ) : (
              <div className="text-foreground text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                {renderMarkdown(message.content)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            {modelBadge && (
              <span className="px-2 py-0.5 rounded-full bg-primary/5 border border-primary/20 text-xs font-medium">
                {modelBadge}
              </span>
            )}
            <span>{formatTimestamp(message.timestamp)}</span>
            {!isUser && (
              <>
                <div className="relative group">
                  <button
                    type="button"
                    onClick={async () => {
                      // Convert markdown to HTML for better paste compatibility
                      const htmlContent = markdownToHtml(message.content);
                      
                      // Use Clipboard API to write both HTML and plain text
                      const clipboardItem = new ClipboardItem({
                        "text/html": new Blob([htmlContent], { type: "text/html" }),
                        "text/plain": new Blob([message.content], { type: "text/plain" }),
                      });
                      
                      try {
                        await navigator.clipboard.write([clipboardItem]);
                        addToast({ type: "success", message: "Copied to clipboard!" });
                      } catch (err) {
                        // Fallback to plain text if ClipboardItem API fails
                        await navigator.clipboard.writeText(message.content);
                        addToast({ type: "success", message: "Copied to clipboard!" });
                      }
                    }}
                    className="hover:text-foreground transition-colors p-1 rounded hover:bg-muted cursor-pointer"
                    aria-label="Copy message"
                    title="Copy message"
                    tabIndex={0}
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
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    Copy message
                  </span>
                </div>
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => setSaveDialogOpen(true)}
                    className="hover:text-foreground transition-colors p-1 rounded hover:bg-muted cursor-pointer"
                    aria-label="Save to notes"
                    title="Save to notes"
                    tabIndex={0}
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
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    Save to notes
                  </span>
                </div>
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
