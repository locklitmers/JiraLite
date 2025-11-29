import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { issueId } = await params;

    const issue = await db.issue.findUnique({
      where: { id: issueId },
      include: {
        project: {
          include: {
            team: { include: { members: true } },
          },
        },
        _count: {
          select: { comments: { where: { deletedAt: null } } },
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

    return NextResponse.json({
      description: issue.description,
      commentsCount: issue._count.comments,
    });
  } catch (error) {
    console.error("Issue info error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

