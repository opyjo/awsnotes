import { NextRequest, NextResponse } from "next/server";
import { summarizeNote } from "@/lib/openai";

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
    const { noteContent } = body;

    if (!noteContent || typeof noteContent !== "string") {
      return NextResponse.json(
        { error: "noteContent is required and must be a string" },
        { status: 400 }
      );
    }

    const summary = await summarizeNote(noteContent);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error in summarize API:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to summarize note",
      },
      { status: 500 }
    );
  }
};
