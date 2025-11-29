"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/get-user";
import { createIssueSchema, updateIssueSchema, createCommentSchema, moveIssueSchema } from "@/lib/validations/issue";
import { revalidatePath } from "next/cache";

export async function createIssue(formData: FormData) {
  const user = await requireUser();

  const dueDateStr = formData.get("dueDate") as string;
  const rawData = {
    title: formData.get("title") as string,
    description: formData.get("description") as string || undefined,
    priority: formData.get("priority") as string,
    type: formData.get("type") as string,
    statusId: formData.get("statusId") as string,
    assigneeId: formData.get("assigneeId") as string || null,
    projectId: formData.get("projectId") as string,
    dueDate: dueDateStr ? new Date(dueDateStr).toISOString() : null,
  };

  const result = createIssueSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const { projectId, ...data } = result.data;

  // Check if user has access to the project
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      team: { include: { members: true } },
      issues: { orderBy: { number: "desc" }, take: 1 },
    },
  });

  if (!project) {
    return { error: "Project not found" };
  }

  const membership = project.team.members.find((m: any) => m.userId === user.id);
  if (!membership) {
    return { error: "You don't have access to this project" };
  }

  const nextNumber = (project.issues[0]?.number ?? 0) + 1;

  // Get label IDs from formData
  const labelIds = formData.getAll("labelIds") as string[];

  const issue = await db.issue.create({
    data: {
      ...data,
      number: nextNumber,
      projectId,
      reporterId: user.id,
      labels: labelIds.length > 0 ? {
        create: labelIds.map(labelId => ({ labelId })),
      } : undefined,
    },
  });

  // Create activity
  await db.issueActivity.create({
    data: {
      issueId: issue.id,
      userId: user.id,
      action: "created",
    },
  });

  // Create notification for assignee
  if (data.assigneeId && data.assigneeId !== user.id) {
    await db.notification.create({
      data: {
        userId: data.assigneeId,
        type: "ISSUE_ASSIGNED" as const,
        title: "Issue Assigned",
        message: `You were assigned to ${project.key}-${nextNumber}: ${data.title}`,
        link: `/projects/${projectId}/issues/${issue.id}`,
      },
    });
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true, issue };
}

export async function updateIssue(issueId: string, formData: FormData) {
  const user = await requireUser();

  const issue = await db.issue.findUnique({
    where: { id: issueId },
    include: {
      project: { include: { team: { include: { members: true } } } },
    },
  });

  if (!issue) {
    return { error: "Issue not found" };
  }

  const membership = issue.project.team.members.find((m: any) => m.userId === user.id);
  if (!membership) {
    return { error: "You don't have access to this issue" };
  }

  const rawData: Record<string, unknown> = {};
  
  const title = formData.get("title");
  if (title) rawData.title = title;
  
  const description = formData.get("description");
  if (description !== null) rawData.description = description || null;
  
  const priority = formData.get("priority");
  if (priority) rawData.priority = priority;
  
  const type = formData.get("type");
  if (type) rawData.type = type;
  
  const statusId = formData.get("statusId");
  if (statusId) rawData.statusId = statusId;
  
  const assigneeId = formData.get("assigneeId");
  if (assigneeId !== undefined) rawData.assigneeId = assigneeId || null;

  const result = updateIssueSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  // Track changes for activity log
  const changes: { field: string; oldValue: string | null; newValue: string | null }[] = [];

  if (result.data.title && result.data.title !== issue.title) {
    changes.push({ field: "title", oldValue: issue.title, newValue: result.data.title });
  }
  if (result.data.priority && result.data.priority !== issue.priority) {
    changes.push({ field: "priority", oldValue: issue.priority, newValue: result.data.priority });
  }
  if (result.data.type && result.data.type !== issue.type) {
    changes.push({ field: "type", oldValue: issue.type, newValue: result.data.type });
  }
  if (result.data.statusId && result.data.statusId !== issue.statusId) {
    changes.push({ field: "status", oldValue: issue.statusId, newValue: result.data.statusId });
  }
  if (result.data.assigneeId !== undefined && result.data.assigneeId !== issue.assigneeId) {
    changes.push({ field: "assignee", oldValue: issue.assigneeId, newValue: result.data.assigneeId || null });
    
    // Notify new assignee
    if (result.data.assigneeId && result.data.assigneeId !== user.id) {
      await db.notification.create({
        data: {
          userId: result.data.assigneeId,
          type: "ISSUE_ASSIGNED" as const,
          title: "Issue Assigned",
          message: `You were assigned to ${issue.project.key}-${issue.number}: ${issue.title}`,
          link: `/projects/${issue.projectId}/issues/${issue.id}`,
        },
      });
    }
  }

  await db.issue.update({
    where: { id: issueId },
    data: result.data,
  });

  // Create activity entries
  for (const change of changes) {
    await db.issueActivity.create({
      data: {
        issueId,
        userId: user.id,
        action: "updated",
        field: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
      },
    });
  }

  revalidatePath(`/projects/${issue.projectId}`);
  revalidatePath(`/projects/${issue.projectId}/issues/${issueId}`);
  return { success: true };
}

export async function deleteIssue(issueId: string) {
  const user = await requireUser();

  const issue = await db.issue.findUnique({
    where: { id: issueId },
    include: {
      project: { include: { team: { include: { members: true } } } },
    },
  });

  if (!issue) {
    return { error: "Issue not found" };
  }

  const membership = issue.project.team.members.find((m: any) => m.userId === user.id);
  if (!membership) {
    return { error: "You don't have access to this issue" };
  }

  // Only reporter, admins, or owners can delete
  const canDelete =
    issue.reporterId === user.id ||
    membership.role === "OWNER" ||
    membership.role === "ADMIN";

  if (!canDelete) {
    return { error: "You don't have permission to delete this issue" };
  }

  await db.issue.delete({
    where: { id: issueId },
  });

  revalidatePath(`/projects/${issue.projectId}`);
  return { success: true, projectId: issue.projectId };
}

export async function moveIssue(data: { issueId: string; statusId: string }) {
  const user = await requireUser();

  const result = moveIssueSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const { issueId, statusId } = result.data;

  const issue = await db.issue.findUnique({
    where: { id: issueId },
    include: {
      project: { include: { team: { include: { members: true } } } },
      status: true,
    },
  });

  if (!issue) {
    return { error: "Issue not found" };
  }

  const membership = issue.project.team.members.find((m: any) => m.userId === user.id);
  if (!membership) {
    return { error: "You don't have access to this issue" };
  }

  if (issue.statusId === statusId) {
    return { success: true };
  }

  const newStatus = await db.issueStatus.findUnique({
    where: { id: statusId },
  });

  if (!newStatus) {
    return { error: "Status not found" };
  }

  await db.issue.update({
    where: { id: issueId },
    data: { statusId },
  });

  // Create activity
  await db.issueActivity.create({
    data: {
      issueId,
      userId: user.id,
      action: "updated",
      field: "status",
      oldValue: issue.status.name,
      newValue: newStatus.name,
    },
  });

  revalidatePath(`/projects/${issue.projectId}`);
  return { success: true };
}

export async function createComment(formData: FormData) {
  const user = await requireUser();

  const rawData = {
    content: formData.get("content") as string,
    issueId: formData.get("issueId") as string,
  };

  const result = createCommentSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const { content, issueId } = result.data;

  const issue = await db.issue.findUnique({
    where: { id: issueId },
    include: {
      project: { include: { team: { include: { members: true } } } },
    },
  });

  if (!issue) {
    return { error: "Issue not found" };
  }

  const membership = issue.project.team.members.find((m: any) => m.userId === user.id);
  if (!membership) {
    return { error: "You don't have access to this issue" };
  }

  const comment = await db.issueComment.create({
    data: {
      content,
      issueId,
      authorId: user.id,
    },
  });

  // Create activity
  await db.issueActivity.create({
    data: {
      issueId,
      userId: user.id,
      action: "commented",
    },
  });

  // Notify issue reporter and assignee
  const notifyUsers = new Set<string>();
  if (issue.reporterId !== user.id) notifyUsers.add(issue.reporterId);
  if (issue.assigneeId && issue.assigneeId !== user.id) notifyUsers.add(issue.assigneeId);

  for (const userId of Array.from(notifyUsers)) {
    await db.notification.create({
      data: {
        userId,
        type: "ISSUE_COMMENT" as const,
        title: "New Comment",
        message: `${user.name || "Someone"} commented on ${issue.project.key}-${issue.number}`,
        link: `/projects/${issue.projectId}/issues/${issue.id}`,
      },
    });
  }

  revalidatePath(`/projects/${issue.projectId}/issues/${issueId}`);
  return { success: true, comment };
}

export async function updateComment(commentId: string, content: string) {
  const user = await requireUser();

  if (!content.trim()) {
    return { error: "Comment cannot be empty" };
  }

  const comment = await db.issueComment.findUnique({
    where: { id: commentId },
    include: {
      issue: {
        include: {
          project: { include: { team: { include: { members: true } } } },
        },
      },
    },
  });

  if (!comment) {
    return { error: "Comment not found" };
  }

  // Only comment author can edit
  if (comment.authorId !== user.id) {
    return { error: "You can only edit your own comments" };
  }

  await db.issueComment.update({
    where: { id: commentId },
    data: { content },
  });

  revalidatePath(`/projects/${comment.issue.projectId}/issues/${comment.issueId}`);
  return { success: true };
}

export async function deleteComment(commentId: string) {
  const user = await requireUser();

  const comment = await db.issueComment.findUnique({
    where: { id: commentId },
    include: {
      issue: {
        include: {
          project: { include: { team: { include: { members: true } } } },
        },
      },
    },
  });

  if (!comment) {
    return { error: "Comment not found" };
  }

  const membership = comment.issue.project.team.members.find((m: any) => m.userId === user.id);
  if (!membership) {
    return { error: "You don't have access to this comment" };
  }

  // Only comment author or admins can delete
  const canDelete =
    comment.authorId === user.id ||
    membership.role === "OWNER" ||
    membership.role === "ADMIN";

  if (!canDelete) {
    return { error: "You don't have permission to delete this comment" };
  }

  await db.issueComment.delete({
    where: { id: commentId },
  });

  revalidatePath(`/projects/${comment.issue.projectId}/issues/${comment.issueId}`);
  return { success: true };
}

