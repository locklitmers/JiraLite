import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { checkSimpleRateLimit } from "@/lib/ai-rate-limit";
import { chatCompletion } from "@/lib/ai-client";

const MIN_DESCRIPTION_LENGTH = 10;

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

    const { issueId, type } = await request.json();

    if (!issueId || !type) {
      return NextResponse.json({ error: "Missing issueId or type" }, { status: 400 });
    }

    // Get issue with comments
    const issue = await db.issue.findUnique({
      where: { id: issueId },
      include: {
        project: {
          include: {
            team: { include: { members: true } },
            labels: true,
          },
        },
        comments: {
          where: { deletedAt: null },
          include: { author: true },
          orderBy: { createdAt: "asc" },
        },
        status: true,
        assignee: true,
        reporter: true,
        labels: {
          include: { label: true },
        },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Check access
    const membership = issue.project.team.members.find((m) => m.userId === user.id);
    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check minimum description length for summary/suggestions
    const descriptionText = issue.description?.replace(/<[^>]*>/g, '') || '';
    if ((type === "summary" || type === "suggestions") && descriptionText.length <= MIN_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { 
          error: `Description must be more than ${MIN_DESCRIPTION_LENGTH} characters for AI features.`,
          minLengthError: true,
        }, 
        { status: 400 }
      );
    }

    // Check minimum comments for comment_summary
    if (type === "comment_summary" && issue.comments.length < 5) {
      return NextResponse.json(
        { 
          error: "At least 5 comments are required for comment summary.",
          minCommentsError: true,
        }, 
        { status: 400 }
      );
    }

    // Check cache
    const cached = await db.aICache.findUnique({
      where: {
        issueId_type: {
          issueId,
          type,
        },
      },
    });

    if (cached && cached.expiresAt > new Date()) {
      return NextResponse.json({ 
        result: cached.output, 
        cached: true,
        remaining: rateLimit.remaining,
      });
    }

    // Build prompt based on type
    let prompt = "";
    const issueContext = `
Issue: ${issue.title}
Type: ${issue.type}
Priority: ${issue.priority}
Status: ${issue.status.name}
Description: ${descriptionText || "No description"}
Reporter: ${issue.reporter.name || issue.reporter.email}
Assignee: ${issue.assignee?.name || "Unassigned"}
Current Labels: ${issue.labels.map(l => l.label.name).join(", ") || "None"}
    `.trim();

    switch (type) {
      case "summary":
        prompt = `Summarize this issue concisely in 2-4 sentences. Focus on the key problem, current status, and any important details.

${issueContext}`;
        break;

      case "suggestions":
        prompt = `Provide 3-5 actionable suggestions to improve or resolve this issue. Be specific and practical.

${issueContext}`;
        break;

      case "comment_summary":
        const commentsText = issue.comments
          .map((c) => `${c.author.name || c.author.email}: ${c.content.replace(/<[^>]*>/g, '')}`)
          .join("\n");
        
        prompt = `Summarize the following discussion about this issue in 3-5 sentences. Highlight key decisions if any.

Issue: ${issue.title}
Description: ${descriptionText}

Discussion (${issue.comments.length} comments):
${commentsText}`;
        break;

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const result = await chatCompletion({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant for issue management. Provide concise, actionable insights.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      maxTokens: 500,
      temperature: 0.7,
    });

    // Cache the result (24 hours)
    await db.aICache.upsert({
      where: {
        issueId_type: {
          issueId,
          type,
        },
      },
      create: {
        issueId,
        type,
        input: issueContext,
        output: result,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      update: {
        input: issueContext,
        output: result,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ 
      result, 
      cached: false,
      remaining: rateLimit.remaining,
    });
  } catch (error) {
    console.error("AI Summary error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI response" },
      { status: 500 }
    );
  }
}
