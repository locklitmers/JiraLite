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

    // Get project with existing issues
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        team: { include: { members: true } },
        issues: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            description: true,
            number: true,
            status: { select: { name: true, isClosed: true } },
          },
          take: 50, // Limit to recent 50 issues for performance
          orderBy: { createdAt: "desc" },
        },
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

    // If no existing issues, return empty
    if (project.issues.length === 0) {
      return NextResponse.json({ 
        duplicates: [],
        message: "No existing issues to compare",
      });
    }

    const existingIssues = project.issues.map(i => ({
      id: i.id,
      number: i.number,
      title: i.title,
      status: i.status.name,
      isClosed: i.status.isClosed,
    }));

    const issuesList = existingIssues
      .map(i => `#${i.number}: ${i.title} [${i.status}]`)
      .join("\n");

    const descriptionText = description?.replace(/<[^>]*>/g, '') || '';

    const prompt = `Compare the following new issue with existing issues and identify potential duplicates or very similar issues.

New Issue Title: ${title}
New Issue Description: ${descriptionText || "No description"}

Existing Issues:
${issuesList}

Return a JSON array of issue numbers that are potential duplicates or very similar (max 3).
Format: [1, 5, 12] (just the numbers)
If no duplicates found, return an empty array [].
Only flag issues that are truly similar in meaning, not just sharing a few words.`;

    const responseText = await chatCompletion({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that detects duplicate issues. Return only valid JSON arrays of numbers.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      maxTokens: 50,
      temperature: 0.2,
    });
    
    // Parse the response
    let duplicateNumbers: number[] = [];
    try {
      // Try to extract JSON array from the response
      const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          duplicateNumbers = parsed.filter(n => typeof n === "number");
        }
      }
    } catch {
      // Try to extract numbers from text
      const matches = responseText.match(/\d+/g);
      if (matches) {
        duplicateNumbers = matches.map(Number).slice(0, 3);
      }
    }

    // Map to actual issues
    const duplicateIssues = existingIssues
      .filter(i => duplicateNumbers.includes(i.number))
      .slice(0, 3)
      .map(i => ({
        id: i.id,
        number: i.number,
        title: i.title,
        status: i.status,
        isClosed: i.isClosed,
        link: `/projects/${projectId}/issues/${i.id}`,
      }));

    return NextResponse.json({ 
      duplicates: duplicateIssues,
      remaining: rateLimit.remaining,
    });
  } catch (error) {
    console.error("AI Duplicate Check error:", error);
    return NextResponse.json(
      { error: "Failed to check for duplicates" },
      { status: 500 }
    );
  }
}
