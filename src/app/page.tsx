import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50/50 via-blue-100/30 to-blue-50/40 dark:from-blue-950/30 dark:via-blue-900/20 dark:to-blue-950/25 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.2),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(96,165,250,0.12),transparent_50%)] dark:bg-[radial-gradient(circle_at_70%_80%,rgba(96,165,250,0.18),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(147,197,253,0.08),transparent_60%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(147,197,253,0.12),transparent_60%)] pointer-events-none" />
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <main className="w-full max-w-4xl space-y-8 relative z-10">
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
