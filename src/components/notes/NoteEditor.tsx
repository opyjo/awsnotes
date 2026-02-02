"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAI } from "@/hooks/useAI";
import { useToast } from "@/components/ui/toast";
import { AIExplainPanel } from "./AIExplainPanel";

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

interface NoteEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
}

export const NoteEditor = ({
  content,
  onChange,
  className,
}: NoteEditorProps) => {
  const { summarizeNote, loading: aiLoading } = useAI();
  const { addToast } = useToast();
  const [explainPanelOpen, setExplainPanelOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectionToolbar, setSelectionToolbar] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable the default code block since we're using CodeBlockLowlight
        codeBlock: false,
      }),
      Image.configure({
        inline: true,
        allowBase64: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content,
    immediatelyRender: false, // Prevent SSR hydration mismatch
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        setSelectionToolbar(null);
        return;
      }
      const selected = editor.state.doc.textBetween(from, to);
      if (!selected.trim()) {
        setSelectionToolbar(null);
        return;
      }

      const start = editor.view.coordsAtPos(from);
      const end = editor.view.coordsAtPos(to);
      setSelectedText(selected);
      setSelectionToolbar({
        x: (start.left + end.right) / 2,
        y: Math.max(8, Math.min(start.top, end.top) - 10),
      });
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[300px] p-4",
      },
    },
  });

  useEffect(() => {
    const handleScroll = () => {
      setSelectionToolbar(null);
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  const handleImageUpload = (url: string) => {
    if (editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleSummarize = async () => {
    if (!editor) return;

    const currentContent = editor.getHTML();
    if (!currentContent.trim()) {
      addToast({
        type: "error",
        message: "Please add some content to summarize",
      });
      return;
    }

    try {
      // Extract text from HTML for summarization
      const textContent = editor.getText();
      const summary = await summarizeNote(textContent);
      const safeSummary = escapeHtml(summary).replace(/\n/g, "<br>");

      // Insert summary at the beginning of the document
      editor
        .chain()
        .focus()
        .setContent(`<h2>Summary</h2><p>${safeSummary}</p><hr>${currentContent}`)
        .run();

      addToast({
        type: "success",
        message: "Summary added to note",
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Failed to summarize",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  const handleSummarizeSelection = async () => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const selection = editor.state.doc.textBetween(from, to);

    if (!selection.trim()) {
      addToast({
        type: "error",
        message: "Please select some text to summarize",
      });
      return;
    }

    try {
      const summary = await summarizeNote(selection);
      const safeSummary = escapeHtml(summary).replace(/\n/g, "<br>");
      editor
        .chain()
        .focus()
        .insertContentAt(
          to,
          `<p><strong>Summary:</strong> ${safeSummary}</p>`
        )
        .run();
      addToast({
        type: "success",
        message: "Summary added below selection",
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Failed to summarize",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  const handleExplainSelection = () => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);

    if (!selectedText.trim()) {
      addToast({
        type: "error",
        message: "Please select some text to explain",
      });
      return;
    }

    setSelectedText(selectedText);
    setExplainPanelOpen(true);
  };

  const handleInsertExplanation = (explanation: string) => {
    if (!editor) return;

    const { from } = editor.state.selection;
    const safeExplanation = escapeHtml(explanation).replace(/\n/g, "<br>");
    editor
      .chain()
      .focus()
      .insertContentAt(
        from,
        `<p><strong>Explanation:</strong> ${safeExplanation}</p>`
      )
      .run();

    addToast({
      type: "success",
      message: "Explanation added to note",
    });
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {selectionToolbar && (
        <div
          className="fixed z-50 flex items-center gap-1 rounded-full border border-border/60 bg-background/95 px-2 py-1 shadow-lg"
          style={{
            left: selectionToolbar.x,
            top: selectionToolbar.y,
            transform: "translate(-50%, -100%)",
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleExplainSelection}
            className="h-7 px-2 text-xs"
          >
            Explain
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleSummarizeSelection}
            className="h-7 px-2 text-xs"
            disabled={aiLoading}
          >
            Summarize
          </Button>
        </div>
      )}
      <div className="flex items-center gap-2 border-b p-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={editor.isActive("bold") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <strong>B</strong>
          </Button>
          <Button
            type="button"
            variant={editor.isActive("italic") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <em>I</em>
          </Button>
          <Button
            type="button"
            variant={editor.isActive("heading", { level: 1 }) ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            H1
          </Button>
          <Button
            type="button"
            variant={editor.isActive("heading", { level: 2 }) ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </Button>
          <Button
            type="button"
            variant={editor.isActive("bulletList") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            •
          </Button>
          <Button
            type="button"
            variant={editor.isActive("orderedList") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            1.
          </Button>
          <Button
            type="button"
            variant={editor.isActive("codeBlock") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            &lt;/&gt;
          </Button>
        </div>
        <div className="h-6 w-px bg-border mx-1" />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSummarize}
            disabled={aiLoading}
            className="text-primary hover:text-primary"
          >
            {aiLoading ? (
              <span className="flex items-center gap-1">
                <svg
                  className="animate-spin h-3 w-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Summarizing...
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Summarize
              </span>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleExplainSelection}
            className="text-primary hover:text-primary"
          >
            <span className="flex items-center gap-1">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Explain Selection
            </span>
          </Button>
        </div>
      </div>
      <EditorContent editor={editor} />
      <ImageUploader onUploadComplete={handleImageUpload} />
      <AIExplainPanel
        open={explainPanelOpen}
        onOpenChange={setExplainPanelOpen}
        onInsertExplanation={handleInsertExplanation}
        initialConcept={selectedText}
        context={editor?.getText()}
      />
    </div>
  );
};
