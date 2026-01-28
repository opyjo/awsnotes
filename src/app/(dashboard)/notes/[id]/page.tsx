"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { NotesProvider, useNotes } from "@/context/NotesContext";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EditNoteForm = () => {
  const router = useRouter();
  const params = useParams();
  const noteId = params.id as string;
  const { getNote, updateNote, deleteNote } = useNotes();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadNote = async () => {
      const note = await getNote(noteId);
      if (note) {
        setTitle(note.title);
        setContent(note.content);
        setCategory(note.category || "");
        setTags(note.tags?.join(", ") || "");
      }
      setLoading(false);
    };
    loadNote();
  }, [noteId, getNote]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const tagArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      await updateNote(noteId, {
        title,
        content,
        category: category || undefined,
        tags: tagArray.length > 0 ? tagArray : undefined,
      });

      router.push("/notes");
    } catch (error) {
      console.error("Error updating note:", error);
      alert("Failed to update note");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this note?")) {
      await deleteNote(noteId);
      router.push("/notes");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading note...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit Note</h1>
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
        >
          Delete
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
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
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
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

export default function EditNotePage() {
  return (
    <NotesProvider>
      <EditNoteForm />
    </NotesProvider>
  );
}
