"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAI } from "@/hooks/useAI";
import { useFlashcards } from "@/context/FlashcardsContext";
import { useNotes } from "@/context/NotesContext";
import { useToast } from "@/components/ui/toast";
import type { Flashcard as AIFlashcard } from "@/lib/openai";
import { cn } from "@/lib/utils";
import { FloatingPanel } from "@/components/ui/floating-panel";

interface AIFlashcardGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId?: string;
  noteContent?: string;
  deckId: string;
}

export const AIFlashcardGenerator = ({
  open,
  onOpenChange,
  noteId,
  noteContent: providedNoteContent,
  deckId,
}: AIFlashcardGeneratorProps) => {
  const { generateFlashcards, loading } = useAI();
  const { createFlashcard } = useFlashcards();
  const { getNote, notes, fetchNotes } = useNotes();
  const { addToast } = useToast();
  const [generatedFlashcards, setGeneratedFlashcards] = useState<
    AIFlashcard[]
  >([]);
  const [selectedFlashcards, setSelectedFlashcards] = useState<Set<number>>(
    new Set()
  );
  const [saving, setSaving] = useState(false);
  const [noteContent, setNoteContent] = useState(providedNoteContent || "");
  const [fetchingNote, setFetchingNote] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string>(
    noteId || ""
  );
  const [inputMode, setInputMode] = useState<"select" | "paste">("select");
  const [flashcardCount, setFlashcardCount] = useState<number>(5);

  // Fetch notes when dialog opens
  useEffect(() => {
    if (open && fetchNotes) {
      fetchNotes();
    }
  }, [open, fetchNotes]);

  // Fetch note content if noteId is provided initially
  useEffect(() => {
    const fetchNoteContent = async () => {
      if (noteId && !providedNoteContent && open && getNote) {
        setFetchingNote(true);
        try {
          const note = await getNote(noteId);
          if (note) {
            // Extract text from HTML content
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = note.content;
            const textContent = tempDiv.textContent || tempDiv.innerText || "";
            setNoteContent(textContent);
            setSelectedNoteId(noteId);
          }
        } catch {
          addToast({
            type: "error",
            message: "Failed to load note content",
          });
        } finally {
          setFetchingNote(false);
        }
      } else if (providedNoteContent) {
        setNoteContent(providedNoteContent);
      }
    };

    fetchNoteContent();
  }, [noteId, providedNoteContent, open, getNote, addToast]);

  // Handle note selection from dropdown
  const handleNoteSelect = async (selectedId: string) => {
    if (!selectedId) {
      setSelectedNoteId("");
      setNoteContent("");
      return;
    }

    setSelectedNoteId(selectedId);
    
    // First try to find the note in the already-loaded notes array
    const noteFromList = notes.find((n) => n.noteId === selectedId);
    if (noteFromList && noteFromList.content) {
      // Extract text from HTML content
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = noteFromList.content;
      const textContent = tempDiv.textContent || tempDiv.innerText || "";
      setNoteContent(textContent);
      return;
    }

    // Fallback: fetch from API if not found in list
    setFetchingNote(true);
    try {
      const note = await getNote(selectedId);
      if (note) {
        // Extract text from HTML content
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = note.content;
        const textContent = tempDiv.textContent || tempDiv.innerText || "";
        setNoteContent(textContent);
      }
    } catch {
      addToast({
        type: "error",
        message: "Failed to load note content",
      });
    } finally {
      setFetchingNote(false);
    }
  };

  const handleGenerate = async () => {
    if (!noteContent.trim()) {
      addToast({
        type: "error",
        message: "Please provide note content to generate flashcards",
      });
      return;
    }

    try {
      const flashcards = await generateFlashcards(noteContent, flashcardCount);
      setGeneratedFlashcards(flashcards);
      // Select all by default
      setSelectedFlashcards(new Set(flashcards.map((_, i) => i)));
      addToast({
        type: "success",
        message: `Generated ${flashcards.length} flashcards`,
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Failed to generate flashcards",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  const handleToggleSelect = (index: number) => {
    const newSelected = new Set(selectedFlashcards);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedFlashcards(newSelected);
  };

  const handleEditFlashcard = (
    index: number,
    field: "front" | "back",
    value: string
  ) => {
    const updated = [...generatedFlashcards];
    updated[index] = { ...updated[index], [field]: value };
    setGeneratedFlashcards(updated);
  };

  const handleRemoveFlashcard = (index: number) => {
    const updated = generatedFlashcards.filter((_, i) => i !== index);
    setGeneratedFlashcards(updated);
    const newSelected = new Set(selectedFlashcards);
    newSelected.delete(index);
    // Adjust indices for remaining selected items
    const adjustedSelected = new Set<number>();
    newSelected.forEach((i) => {
      if (i < index) {
        adjustedSelected.add(i);
      } else if (i > index) {
        adjustedSelected.add(i - 1);
      }
    });
    setSelectedFlashcards(adjustedSelected);
  };

  const handleSave = async () => {
    if (selectedFlashcards.size === 0) {
      addToast({
        type: "error",
        message: "Please select at least one flashcard to save",
      });
      return;
    }

    setSaving(true);

    try {
      const flashcardsToSave = Array.from(selectedFlashcards)
        .sort((a, b) => a - b)
        .map((index) => generatedFlashcards[index]);

      // Use selectedNoteId if available, otherwise fall back to noteId prop
      const finalNoteId = selectedNoteId || noteId;

      for (const flashcard of flashcardsToSave) {
        await createFlashcard({
          deckId,
          front: flashcard.front,
          back: flashcard.back,
          noteId: finalNoteId,
        });
      }

      addToast({
        type: "success",
        message: `Successfully created ${flashcardsToSave.length} flashcards`,
      });

      // Reset state
      setGeneratedFlashcards([]);
      setSelectedFlashcards(new Set());
      setNoteContent(providedNoteContent || "");
      onOpenChange(false);
    } catch (error) {
      addToast({
        type: "error",
        title: "Failed to save flashcards",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setGeneratedFlashcards([]);
    setSelectedFlashcards(new Set());
    setNoteContent(providedNoteContent || "");
    setSelectedNoteId(noteId || "");
    setFetchingNote(false);
    setInputMode("select");
    setFlashcardCount(5);
    onOpenChange(false);
  };

  return (
    <FloatingPanel
      open={open}
      onOpenChange={handleClose}
      title="Generate Flashcards with AI"
      description="AI will generate flashcards from your note content. Review and edit them before saving."
      className="space-y-4"
    >
      <div className="space-y-4">
          {fetchingNote && (
            <div className="text-center py-8">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <svg
                  className="animate-spin h-4 w-4"
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
                Loading note content...
              </div>
            </div>
          )}

          {!fetchingNote && !providedNoteContent && (
            <div className="space-y-4">
              {/* Note Selection Mode Toggle */}
              <div className="flex gap-2 border-b pb-4">
                <Button
                  type="button"
                  variant={inputMode === "select" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setInputMode("select")}
                >
                  Select Note
                </Button>
                <Button
                  type="button"
                  variant={inputMode === "paste" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setInputMode("paste")}
                >
                  Paste Content
                </Button>
              </div>

              {inputMode === "select" ? (
                <div className="space-y-2">
                  <Label htmlFor="note-select">Select a Note</Label>
                  <select
                    id="note-select"
                    value={selectedNoteId}
                    onChange={(e) => handleNoteSelect(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={loading}
                  >
                    <option value="">-- Select a note --</option>
                    {notes.map((note) => (
                      <option key={note.noteId} value={note.noteId}>
                        {note.title}
                      </option>
                    ))}
                  </select>
                  {selectedNoteId && noteContent && (
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">
                        Note content loaded ({noteContent.length} characters)
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="note-content">Note Content</Label>
                  <textarea
                    id="note-content"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Paste your note content here..."
                    className="w-full min-h-[150px] p-3 border rounded-lg resize-y"
                    disabled={loading}
                  />
                </div>
              )}
            </div>
          )}

          {providedNoteContent && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Using content from current note ({noteContent.length} characters)
              </p>
            </div>
          )}

          {!fetchingNote && generatedFlashcards.length === 0 && (
            <div className="space-y-4 py-8">
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="flashcard-count" className="text-sm font-medium">
                    Number of flashcards:
                  </Label>
                  <Input
                    id="flashcard-count"
                    type="number"
                    min="1"
                    max="20"
                    value={flashcardCount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (!isNaN(value) && value >= 1 && value <= 20) {
                        setFlashcardCount(value);
                      }
                    }}
                    className="w-20"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="text-center">
                <Button
                  onClick={handleGenerate}
                  disabled={
                    loading ||
                    (!providedNoteContent &&
                      !noteId &&
                      !noteContent.trim() &&
                      !selectedNoteId)
                  }
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
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
                      Generating...
                    </span>
                  ) : (
                    `Generate ${flashcardCount} Flashcard${flashcardCount !== 1 ? "s" : ""}`
                  )}
                </Button>
              </div>
            </div>
          )}

          {generatedFlashcards.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {selectedFlashcards.size} of {generatedFlashcards.length}{" "}
                  flashcards selected
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFlashcards(
                        new Set(
                          generatedFlashcards.map((_, i) => i)
                        )
                      );
                    }}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFlashcards(new Set())}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {generatedFlashcards.map((flashcard, index) => {
                  const cardId = `flashcard-${index}-${flashcard.front.substring(0, 20)}`;
                  return (
                  <Card
                    key={cardId}
                    className={cn(
                      "transition-all",
                      selectedFlashcards.has(index)
                        ? "border-primary border-2"
                        : "border-border"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedFlashcards.has(index)}
                          onChange={() => handleToggleSelect(index)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div>
                            <label
                              htmlFor={`front-${cardId}`}
                              className="text-xs font-semibold text-muted-foreground"
                            >
                              Front (Question)
                            </label>
                            <textarea
                              id={`front-${cardId}`}
                              value={flashcard.front}
                              onChange={(e) =>
                                handleEditFlashcard(index, "front", e.target.value)
                              }
                              className="w-full p-2 border rounded text-sm"
                              rows={2}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor={`back-${cardId}`}
                              className="text-xs font-semibold text-muted-foreground"
                            >
                              Back (Answer)
                            </label>
                            <textarea
                              id={`back-${cardId}`}
                              value={flashcard.back}
                              onChange={(e) =>
                                handleEditFlashcard(index, "back", e.target.value)
                              }
                              className="w-full p-2 border rounded text-sm"
                              rows={3}
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFlashcard(index)}
                          className="text-destructive hover:text-destructive"
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
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
          <Button type="button" variant="outline" onClick={() => handleClose()}>
            Cancel
          </Button>
          {generatedFlashcards.length > 0 && (
            <Button
              onClick={handleSave}
              disabled={saving || selectedFlashcards.size === 0}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
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
                  Saving...
                </span>
              ) : (
                `Save ${selectedFlashcards.size} Flashcard${selectedFlashcards.size === 1 ? "" : "s"}`
              )}
            </Button>
          )}
        </div>
    </FloatingPanel>
  );
};
