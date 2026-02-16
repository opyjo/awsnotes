"use client";

import { useState } from "react";
import { useFlashcards } from "@/hooks/api/useFlashcards";
import { useNotes } from "@/hooks/api/useNotes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateFlashcardModal } from "@/components/flashcards/CreateFlashcardModal";
import { AIFlashcardGenerator } from "@/components/flashcards/AIFlashcardGenerator";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function FlashcardsPage() {
  const { dueFlashcards, isLoading: loading, createFlashcard } = useFlashcards();
  const { notes } = useNotes();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);
  const [selectedDeckId] = useState("default");

  const handleCreateFlashcard = async (input: any) => {
    await createFlashcard(input);
  };

  const stats = [
    {
      label: "Due for Review",
      value: dueFlashcards.length,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-600 dark:text-blue-400",
      gradient: "bg-gradient-to-br",
    },
    {
      label: "Total Cards",
      value: 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
      color: "from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-600 dark:text-purple-400",
      gradient: "bg-gradient-to-br",
    },
    {
      label: "Decks",
      value: 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
      color: "from-green-500/10 to-green-600/5 border-green-500/20 text-green-600 dark:text-green-400",
      gradient: "bg-gradient-to-br",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Flashcards
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and review flashcards to master AWS concepts
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 transition-all duration-200"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Flashcard
          </Button>
          <Button
            variant="outline"
            onClick={() => setAiGeneratorOpen(true)}
            className="border-2 hover:border-primary/50 transition-all duration-200"
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
            Generate from Note
          </Button>
          {dueFlashcards.length > 0 && (
            <Button
              asChild
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
            >
              <Link href="/flashcards/review">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Review ({dueFlashcards.length} due)
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <Card
            key={stat.label}
            className={cn(
              "border-2 overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
              stat.gradient,
              stat.color,
              "animate-slide-in-up"
            )}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={cn("p-3 rounded-xl", stat.color)}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Area */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <svg
                className="animate-spin h-5 w-5"
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
              <span>Loading flashcards...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-dashed">
          <CardContent className="py-16 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted border-2 border-border">
                <svg
                  className="w-8 h-8 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No flashcards yet</h3>
                <p className="text-muted-foreground mb-6">
                  Get started by creating your first flashcard or generating them from your notes using AI.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button onClick={() => setCreateModalOpen(true)}>
                    Create Flashcard
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setAiGeneratorOpen(true)}
                  >
                    Generate with AI
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <CreateFlashcardModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreate={handleCreateFlashcard}
        deckId={selectedDeckId}
        onGenerateFromNote={() => setAiGeneratorOpen(true)}
      />
      <AIFlashcardGenerator
        open={aiGeneratorOpen}
        onOpenChange={setAiGeneratorOpen}
        deckId={selectedDeckId}
      />
    </div>
  );
}
