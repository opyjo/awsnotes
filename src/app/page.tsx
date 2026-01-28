import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <main className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            AWS Study Notes & Flashcards
          </h1>
          <p className="text-xl text-muted-foreground">
            Create study notes with screenshots, generate flashcards, and review
            them using spaced repetition for AWS certification exams.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Study Notes</CardTitle>
              <CardDescription>
                Create rich text notes with images and organize by AWS service
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Flashcards</CardTitle>
              <CardDescription>
                Generate flashcards from your notes and organize them into decks
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Spaced Repetition</CardTitle>
              <CardDescription>
                Review flashcards using the proven SM-2 algorithm
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/register">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
