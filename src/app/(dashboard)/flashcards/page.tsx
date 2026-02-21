"use client";

import { useState, useMemo } from "react";
import { useFlashcards } from "@/hooks/api/useFlashcards";
import { useGroups } from "@/hooks/api/useGroups";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreateFlashcardModal } from "@/components/flashcards/CreateFlashcardModal";
import { AIFlashcardGenerator } from "@/components/flashcards/AIFlashcardGenerator";
import type { Flashcard } from "@/types/flashcard";
import type { Group } from "@/types/group";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Reassign modal — lets the user move "General" cards into a proper group
// ---------------------------------------------------------------------------
function ReassignModal({
  cards,
  groups,
  onReassign,
  onClose,
}: {
  cards: Flashcard[];
  groups: Group[];
  onReassign: (cardId: string, deckId: string) => Promise<void>;
  onClose: () => void;
}) {
  const [pending, setPending] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const handleSave = async (card: Flashcard) => {
    const newDeckId = pending[card.cardId];
    if (!newDeckId || newDeckId === card.deckId) return;
    setSaving((s) => ({ ...s, [card.cardId]: true }));
    try {
      await onReassign(card.cardId, newDeckId);
    } finally {
      setSaving((s) => ({ ...s, [card.cardId]: false }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-background border-2 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Reassign Cards to Groups</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Move your existing cards into the correct group
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {cards.map((card) => (
            <div
              key={card.cardId}
              className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
            >
              <p className="flex-1 text-sm truncate" title={card.front}>
                {card.front}
              </p>
              <select
                className="text-sm rounded-md border bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/40 w-40 flex-shrink-0"
                defaultValue={card.deckId}
                onChange={(e) =>
                  setPending((p) => ({ ...p, [card.cardId]: e.target.value }))
                }
              >
                <option value="default">General</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                disabled={
                  saving[card.cardId] ||
                  !pending[card.cardId] ||
                  pending[card.cardId] === card.deckId
                }
                onClick={() => handleSave(card)}
                className="flex-shrink-0"
              >
                {saving[card.cardId] ? "Saving…" : "Move"}
              </Button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function FlashcardsPage() {
  const { dueFlashcards, isLoading: loading, createFlashcard, updateFlashcard } =
    useFlashcards();
  const { groups, isLoading: groupsLoading } = useGroups();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState("default");
  const [reassignOpen, setReassignOpen] = useState(false);

  const handleCreateFlashcard = async (input: any) => {
    await createFlashcard(input);
  };

  // Group due flashcards by deckId
  const cardsByDeck = useMemo(() => {
    const map: Record<string, number> = {};
    for (const card of dueFlashcards) {
      map[card.deckId] = (map[card.deckId] ?? 0) + 1;
    }
    return map;
  }, [dueFlashcards]);

  // Build list of sections: known groups + a "General" bucket for unmatched deckIds
  const groupSections = useMemo(() => {
    const groupIds = new Set(groups.map((g) => g.id));
    const generalCards = dueFlashcards.filter((c) => !groupIds.has(c.deckId));
    const generalCount = generalCards.length;
    return { groupIds, generalCount, generalCards };
  }, [groups, dueFlashcards]);

  const isPageLoading = loading || groupsLoading;

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
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Flashcard
          </Button>
          <Button
            variant="outline"
            onClick={() => setAiGeneratorOpen(true)}
            className="border-2 hover:border-primary/50 transition-all duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Review All ({dueFlashcards.length} due)
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {[
          {
            label: "Due for Review",
            value: dueFlashcards.length,
            color: "from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-600 dark:text-blue-400",
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
          {
            label: "Total Groups",
            value: groups.length,
            color: "from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-600 dark:text-purple-400",
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            ),
          },
          {
            label: "Groups with Due Cards",
            value: Object.keys(cardsByDeck).length,
            color: "from-green-500/10 to-green-600/5 border-green-500/20 text-green-600 dark:text-green-400",
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
        ].map((stat, index) => (
          <Card
            key={stat.label}
            className={cn(
              "border-2 overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
              "bg-gradient-to-br",
              stat.color,
              "animate-slide-in-up"
            )}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={cn("p-3 rounded-xl", stat.color)}>{stat.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Group Cards */}
      {isPageLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Loading flashcards...</span>
            </div>
          </CardContent>
        </Card>
      ) : groups.length === 0 && dueFlashcards.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-16 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted border-2 border-border">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No flashcards yet</h3>
                <p className="text-muted-foreground mb-6">
                  Get started by creating your first flashcard or generating them from your notes using AI.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button onClick={() => setCreateModalOpen(true)}>Create Flashcard</Button>
                  <Button variant="outline" onClick={() => setAiGeneratorOpen(true)}>Generate with AI</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground/80">Your Groups</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Known groups */}
            {groups.map((group, index) => {
              const dueCount = cardsByDeck[group.id] ?? 0;
              return (
                <Card
                  key={group.id}
                  className="border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] animate-slide-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardContent className="p-5 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: group.color ?? "#6b7280" }}
                      />
                      <h3 className="font-semibold text-base truncate">{group.name}</h3>
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-sm font-medium px-2 py-0.5 rounded-full",
                          dueCount > 0
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {dueCount > 0 ? `${dueCount} due` : "All caught up"}
                      </span>
                      {dueCount > 0 ? (
                        <Button asChild size="sm" className="shadow-sm">
                          <Link
                            href={`/flashcards/review?deckId=${group.id}&groupName=${encodeURIComponent(group.name)}`}
                          >
                            Review {dueCount}
                          </Link>
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          Review
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* General / unmatched deck bucket */}
            {groupSections.generalCount > 0 && (
              <Card
                className="border-2 border-dashed transition-all duration-300 hover:shadow-lg hover:scale-[1.02] animate-slide-in-up"
                style={{ animationDelay: `${groups.length * 0.05}s` }}
              >
                <CardContent className="p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0" />
                      <h3 className="font-semibold text-base">General</h3>
                    </div>
                    {groups.length > 0 && (
                      <button
                        onClick={() => setReassignOpen(true)}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
                      >
                        Reassign
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {groupSections.generalCount} due
                    </span>
                    <Button asChild size="sm" className="shadow-sm">
                      <Link href="/flashcards/review">
                        Review {groupSections.generalCount}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateFlashcardModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreate={handleCreateFlashcard}
        deckId={selectedDeckId}
        onGenerateFromNote={() => setAiGeneratorOpen(true)}
        groups={groups}
        onDeckChange={setSelectedDeckId}
      />
      <AIFlashcardGenerator
        open={aiGeneratorOpen}
        onOpenChange={setAiGeneratorOpen}
        deckId={selectedDeckId}
      />
      {reassignOpen && (
        <ReassignModal
          cards={groupSections.generalCards}
          groups={groups}
          onReassign={(cardId, deckId) => updateFlashcard(cardId, { deckId })}
          onClose={() => setReassignOpen(false)}
        />
      )}
    </div>
  );
}
