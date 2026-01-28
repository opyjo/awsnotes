"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

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
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[300px] p-4",
      },
    },
  });

  const handleImageUpload = (url: string) => {
    if (editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 border-b p-2">
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
      <EditorContent editor={editor} />
      <ImageUploader onUploadComplete={handleImageUpload} />
    </div>
  );
};
