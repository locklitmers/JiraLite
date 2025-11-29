import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { checkSimpleRateLimit } from "@/lib/ai-rate-limit";
import { chatCompletion } from "@/lib/ai-client";

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check rate limit
    const rateLimit = checkSimpleRateLimit(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: rateLimit.error,
          rateLimited: true,
          resetIn: rateLimit.resetIn,
        }, 
        { status: 429 }
      );
    }

    const { projectId, title, description } = await request.json();

    if (!projectId || !title) {
      return NextResponse.json({ error: "Missing projectId or title" }, { status: 400 });
    }

    // Get project with labels
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        team: { include: { members: true } },
        labels: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check access
    const membership = project.team.members.find((m) => m.userId === user.id);
    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // If no labels in project, return empty
    if (project.labels.length === 0) {
      return NextResponse.json({ 
        labels: [],
        message: "No labels defined in this project",
      });
    }

    const labelsInfo = project.labels.map(l => l.name).join(", ");
    const descriptionText = description?.replace(/<[^>]*>/g, '') || '';

    const prompt = `Based on the following issue, recommend up to 3 most relevant labels from the available labels list.

Issue Title: ${title}
Issue Description: ${descriptionText || "No description"}

Available Labels: ${labelsInfo}

Return ONLY the recommended label names as a JSON array, e.g. ["Bug", "High Priority", "Backend"]. 
If no labels are relevant, return an empty array [].
Only recommend labels that exist in the Available Labels list.`;

    const responseText = await chatCompletion({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that categorizes issues. Return only valid JSON arrays.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      maxTokens: 100,
      temperature: 0.3,
    });
    
    // Parse the response
    let recommendedNames: string[] = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          recommendedNames = parsed;
        }
      }
    } catch {
      // Try to extract labels from text
      const matches = responseText.match(/["']([^"']+)["']/g);
      if (matches) {
        recommendedNames = matches.map(m => m.replace(/["']/g, ''));
      }
    }

    // Map to actual label objects
    const recommendedLabels = project.labels.filter(l => 
      recommendedNames.some(name => 
        name.toLowerCase() === l.name.toLowerCase()
      )
    ).slice(0, 3);

    return NextResponse.json({ 
      labels: recommendedLabels,
      remaining: rateLimit.remaining,
    });
  } catch (error) {
    console.error("AI Auto-Label error:", error);
    return NextResponse.json(
      { error: "Failed to generate label recommendations" },
      { status: 500 }
    );
  }
}
