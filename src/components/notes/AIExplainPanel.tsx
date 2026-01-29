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
import { useAI } from "@/hooks/useAI";
import { useToast } from "@/components/ui/toast";

interface AIExplainPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsertExplanation: (explanation: string) => void;
  initialConcept?: string;
  context?: string;
}

export const AIExplainPanel = ({
  open,
  onOpenChange,
  onInsertExplanation,
  initialConcept = "",
  context,
}: AIExplainPanelProps) => {
  const { explainConcept, loading } = useAI();
  const { addToast } = useToast();
  const [concept, setConcept] = useState(initialConcept);
  const [explanation, setExplanation] = useState("");
  const [contextText, setContextText] = useState(context || "");

  const handleExplain = async () => {
    if (!concept.trim()) {
      addToast({
        type: "error",
        message: "Please enter a concept to explain",
      });
      return;
    }

    try {
      const result = await explainConcept(
        concept,
        contextText.trim() || undefined
      );
      setExplanation(result);
    } catch (error) {
      addToast({
        type: "error",
        title: "Failed to explain concept",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  const handleInsert = () => {
    if (explanation.trim()) {
      onInsertExplanation(explanation);
      handleClose();
    }
  };

  const handleClose = () => {
    setConcept(initialConcept);
    setExplanation("");
    setContextText(context || "");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI Explanation</DialogTitle>
          <DialogDescription>
            Get an AI-powered explanation of AWS concepts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="concept">Concept or Term</Label>
            <Input
              id="concept"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="e.g., EC2, S3, Lambda"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Context (Optional)</Label>
            <Textarea
              id="context"
              value={contextText}
              onChange={(e) => setContextText(e.target.value)}
              placeholder="Provide additional context from your notes..."
              rows={3}
              disabled={loading}
            />
          </div>

          {explanation && (
            <div className="space-y-2">
              <Label>Explanation</Label>
              <div className="p-4 bg-muted rounded-lg border">
                <p className="text-sm whitespace-pre-wrap">{explanation}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
          {!explanation ? (
            <Button onClick={handleExplain} disabled={loading || !concept.trim()}>
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
                  Explaining...
                </span>
              ) : (
                "Explain"
              )}
            </Button>
          ) : (
            <Button onClick={handleInsert}>
              Add to Notes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
