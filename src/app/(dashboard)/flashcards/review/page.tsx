import { FlashcardReview } from "@/components/flashcards/FlashcardReview";

interface ReviewPageProps {
  searchParams: Promise<{ deckId?: string; groupName?: string }>;
}

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const params = await searchParams;
  return <FlashcardReview deckId={params.deckId} groupName={params.groupName} />;
}
