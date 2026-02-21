"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CreateFlashcardInput } from "@/types/flashcard";
import type { Group } from "@/types/group";
import { FloatingPanel } from "@/components/ui/floating-panel";

interface CreateFlashcardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: CreateFlashcardInput) => Promise<void>;
  deckId: string;
  noteId?: string;
  onGenerateFromNote?: () => void;
  groups?: Group[];
  onDeckChange?: (deckId: string) => void;
}

export const CreateFlashcardModal = ({
  open,
  onOpenChange,
  onCreate,
  deckId,
  noteId,
  onGenerateFromNote,
  groups = [],
  onDeckChange,
}: CreateFlashcardModalProps) => {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await onCreate({
        deckId,
        front,
        back,
        noteId,
      });
      setFront("");
      setBack("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating flashcard:", error);
      alert("Failed to create flashcard");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FloatingPanel
      open={open}
      onOpenChange={onOpenChange}
      title="Create Flashcard"
      description="Add a new flashcard to your deck. Fill in the question and answer below."
      className="space-y-4"
    >
      {onGenerateFromNote && (
        <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onGenerateFromNote();
              }}
              className="w-full border-2 border-dashed hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
            >
              <svg
                className="w-4 h-4 mr-2"
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
              Generate from Note with AI
            </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
          {groups.length > 0 && (
            <div className="space-y-3">
              <Label htmlFor="deck" className="text-base font-semibold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                Group
              </Label>
              <select
                id="deck"
                value={deckId}
                onChange={(e) => onDeckChange?.(e.target.value)}
                className="w-full rounded-md border-2 border-input bg-background px-3 py-2 text-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              >
                <option value="default">General</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-3">
            <Label htmlFor="front" className="text-base font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              Front (Question)
            </Label>
            <Textarea
              id="front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              required
              placeholder="What is AWS EC2?"
              className="min-h-[120px] text-base resize-none border-2 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
            <p className="text-xs text-muted-foreground">
              Enter the question or prompt for the front of the card
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="back" className="text-base font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Back (Answer)
            </Label>
            <Textarea
              id="back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              required
              placeholder="Elastic Compute Cloud - virtual servers in the cloud"
              className="min-h-[120px] text-base resize-none border-2 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
            <p className="text-xs text-muted-foreground">
              Enter the answer or explanation for the back of the card
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !front.trim() || !back.trim()}
              className="w-full sm:w-auto shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 transition-all duration-200"
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
                  Creating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Create Flashcard
                </span>
              )}
            </Button>
          </div>
      </form>
    </FloatingPanel>
  );
};
