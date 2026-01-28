"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CreateFlashcardInput } from "@/types/flashcard";

interface CreateFlashcardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: CreateFlashcardInput) => Promise<void>;
  deckId: string;
  noteId?: string;
}

export const CreateFlashcardModal = ({
  open,
  onOpenChange,
  onCreate,
  deckId,
  noteId,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Flashcard</DialogTitle>
          <DialogDescription>
            Add a new flashcard to your deck
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="front">Front (Question)</Label>
            <Textarea
              id="front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              required
              placeholder="What is AWS EC2?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="back">Back (Answer)</Label>
            <Textarea
              id="back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              required
              placeholder="Elastic Compute Cloud - virtual servers in the cloud"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
