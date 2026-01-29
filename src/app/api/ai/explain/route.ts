import { NextRequest, NextResponse } from "next/server";
import { explainConcept } from "@/lib/openai";

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
    const { concept, context } = body;

    if (!concept || typeof concept !== "string") {
      return NextResponse.json(
        { error: "concept is required and must be a string" },
        { status: 400 }
      );
    }

    const explanation = await explainConcept(
      concept,
      context && typeof context === "string" ? context : undefined
    );

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Error in explain API:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to explain concept",
      },
      { status: 500 }
    );
  }
};
