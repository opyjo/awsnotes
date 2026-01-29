import { NextRequest, NextResponse } from "next/server";
import { generateFlashcards } from "@/lib/openai";

export const POST = async (req: NextRequest) => {
  try {
    // Verify authentication - check for Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { noteContent, count } = body;

    if (!noteContent || typeof noteContent !== "string") {
      return NextResponse.json(
        { error: "noteContent is required and must be a string" },
        { status: 400 }
      );
    }

    const flashcardCount = count && typeof count === "number" ? Math.max(1, Math.min(20, count)) : 5;
    const flashcards = await generateFlashcards(noteContent, flashcardCount);

    return NextResponse.json({ flashcards });
  } catch (error) {
    console.error("Error in generate-flashcards API:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate flashcards",
      },
      { status: 500 }
    );
  }
};
