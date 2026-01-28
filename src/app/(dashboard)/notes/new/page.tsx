"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NotesProvider, useNotes } from "@/context/NotesContext";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const CreateNoteForm = () => {
  const router = useRouter();
  const { createNote } = useNotes();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const tagArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      await createNote({
        title,
        content,
        category: category || undefined,
        tags: tagArray.length > 0 ? tagArray : undefined,
      });

      router.push("/notes");
    } catch (error) {
      console.error("Error creating note:", error);
      alert("Failed to create note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="AWS EC2 Instance Types"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="EC2"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <NoteEditor content={content} onChange={setContent} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="compute, instances, aws"
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Note"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default function NewNotePage() {
  return (
    <NotesProvider>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Create New Note</h1>
        <CreateNoteForm />
      </div>
    </NotesProvider>
  );
}
