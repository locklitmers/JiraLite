import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// This endpoint can be called by a cron job (e.g., Vercel Cron, GitHub Actions)
// to send due date notifications
// Call this endpoint once per day

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended for security)
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Find issues due tomorrow (1 day before)
    const issuesDueTomorrow = await db.issue.findMany({
      where: {
        dueDate: {
          gte: tomorrow,
          lt: dayAfterTomorrow,
        },
        assigneeId: { not: null },
        deletedAt: null,
        status: { isClosed: false },
      },
      include: {
        project: true,
        assignee: true,
      },
    });

    // Find issues due today
    const issuesDueToday = await db.issue.findMany({
      where: {
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
        assigneeId: { not: null },
        deletedAt: null,
        status: { isClosed: false },
      },
      include: {
        project: true,
        assignee: true,
      },
    });

    const notifications: { userId: string; type: string; title: string; message: string; link: string }[] = [];

    // Create notifications for issues due tomorrow
    for (const issue of issuesDueTomorrow) {
      if (issue.assigneeId) {
        // Check if notification already exists for today
        const existingNotification = await db.notification.findFirst({
          where: {
            userId: issue.assigneeId,
            link: `/projects/${issue.projectId}/issues/${issue.id}`,
            title: "Due Date Approaching",
            createdAt: { gte: today },
          },
        });

        if (!existingNotification) {
          notifications.push({
            userId: issue.assigneeId,
            type: "ISSUE_UPDATED",
            title: "Due Date Approaching",
            message: `${issue.project.key}-${issue.number}: "${issue.title}" is due tomorrow`,
            link: `/projects/${issue.projectId}/issues/${issue.id}`,
          });
        }
      }
    }

    // Create notifications for issues due today
    for (const issue of issuesDueToday) {
      if (issue.assigneeId) {
        // Check if notification already exists for today
        const existingNotification = await db.notification.findFirst({
          where: {
            userId: issue.assigneeId,
            link: `/projects/${issue.projectId}/issues/${issue.id}`,
            title: "Due Today",
            createdAt: { gte: today },
          },
        });

        if (!existingNotification) {
          notifications.push({
            userId: issue.assigneeId,
            type: "ISSUE_UPDATED",
            title: "Due Today",
            message: `${issue.project.key}-${issue.number}: "${issue.title}" is due today!`,
            link: `/projects/${issue.projectId}/issues/${issue.id}`,
          });
        }
      }
    }

    // Create all notifications
    if (notifications.length > 0) {
      await db.notification.createMany({
        data: notifications,
      });
    }

    return NextResponse.json({
      success: true,
      created: notifications.length,
      dueTomorrow: issuesDueTomorrow.length,
      dueToday: issuesDueToday.length,
    });
  } catch (error) {
    console.error("Due date notification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

