import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const team = await db.team.findUnique({
      where: { slug },
      include: {
        members: {
          include: { user: true },
        },
        projects: {
          where: { deletedAt: null },
          include: {
            statuses: {
              orderBy: { order: "asc" },
            },
            issues: {
              where: { deletedAt: null },
              select: {
                id: true,
                statusId: true,
                assigneeId: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check membership
    const membership = team.members.find((m) => m.userId === user.id);
    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get all issues with activities for trend calculation
    const allIssues = team.projects.flatMap((p) => p.issues);
    
    // Get closed status IDs
    const closedStatusIds = team.projects.flatMap((p) => 
      p.statuses.filter((s) => s.isClosed).map((s) => s.id)
    );

    // Calculate member stats
    const memberStats = team.members.map((m) => {
      const assignedIssues = allIssues.filter((i) => i.assigneeId === m.userId);
      const completedIssues = assignedIssues.filter((i) => closedStatusIds.includes(i.statusId));
      return {
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
        assignedCount: assignedIssues.length,
        completedCount: completedIssues.length,
      };
    });

    // Calculate project stats
    const projectStats = team.projects.map((p) => {
      const statusCounts = p.statuses.map((s) => ({
        name: s.name,
        color: s.color,
        count: p.issues.filter((i) => i.statusId === s.id).length,
      }));
      return {
        id: p.id,
        name: p.name,
        key: p.key,
        statusCounts,
      };
    });

    // Calculate trends
    const trends: { date: string; created: number; completed: number }[] = [];
    
    // Get activities for completion tracking
    const activities = await db.issueActivity.findMany({
      where: {
        issue: {
          project: { teamId: team.id },
          deletedAt: null,
        },
        action: "updated",
        field: "status",
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        newValue: true,
      },
    });

    // Get closed status names for matching
    const closedStatusNames = team.projects.flatMap((p) => 
      p.statuses.filter((s) => s.isClosed).map((s) => s.name)
    );

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const created = allIssues.filter((issue) => {
        const createdAt = new Date(issue.createdAt);
        return createdAt >= date && createdAt < nextDate;
      }).length;

      const completed = activities.filter((a) => {
        const actDate = new Date(a.createdAt);
        return actDate >= date && actDate < nextDate && closedStatusNames.includes(a.newValue || "");
      }).length;

      trends.push({
        date: date.toISOString().split("T")[0],
        created,
        completed,
      });
    }

    // Calculate totals
    const totalIssues = allIssues.length;
    const completedIssues = allIssues.filter((i) => closedStatusIds.includes(i.statusId)).length;
    const openIssues = totalIssues - completedIssues;
    const completionRate = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        slug: team.slug,
      },
      members: memberStats,
      projects: projectStats,
      trends,
      totals: {
        totalIssues,
        completedIssues,
        openIssues,
        completionRate,
      },
    });
  } catch (error) {
    console.error("Team statistics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

