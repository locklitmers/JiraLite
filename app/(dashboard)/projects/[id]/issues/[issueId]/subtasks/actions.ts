"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/get-user";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createSubtaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  issueId: z.string().min(1),
});

const updateSubtaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  completed: z.boolean().optional(),
});

export async function createSubtask(formData: FormData) {
  const user = await requireUser();

  const rawData = {
    title: formData.get("title") as string,
    issueId: formData.get("issueId") as string,
  };

  const result = createSubtaskSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const { title, issueId } = result.data;

  // Check access
  const issue = await db.issue.findUnique({
    where: { id: issueId },
    include: {
      project: { include: { team: { include: { members: true } } } },
      subtasks: { orderBy: { order: "desc" }, take: 1 },
    },
  });

  if (!issue) {
    return { error: "Issue not found" };
  }

  const membership = issue.project.team.members.find((m) => m.userId === user.id);
  if (!membership) {
    return { error: "Access denied" };
  }

  // Check max subtasks (20)
  const subtaskCount = await db.subtask.count({ where: { issueId } });
  if (subtaskCount >= 20) {
    return { error: "Maximum 20 subtasks allowed per issue" };
  }

  const nextOrder = (issue.subtasks[0]?.order ?? 0) + 1;

  const subtask = await db.subtask.create({
    data: {
      title,
      issueId,
      order: nextOrder,
    },
  });

  revalidatePath(`/projects/${issue.projectId}/issues/${issueId}`);
  return { success: true, subtask };
}

export async function updateSubtask(subtaskId: string, data: { title?: string; completed?: boolean }) {
  const user = await requireUser();

  const result = updateSubtaskSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const subtask = await db.subtask.findUnique({
    where: { id: subtaskId },
    include: {
      issue: {
        include: {
          project: { include: { team: { include: { members: true } } } },
        },
      },
    },
  });

  if (!subtask) {
    return { error: "Subtask not found" };
  }

  const membership = subtask.issue.project.team.members.find((m) => m.userId === user.id);
  if (!membership) {
    return { error: "Access denied" };
  }

  await db.subtask.update({
    where: { id: subtaskId },
    data: result.data,
  });

  revalidatePath(`/projects/${subtask.issue.projectId}/issues/${subtask.issueId}`);
  return { success: true };
}

export async function deleteSubtask(subtaskId: string) {
  const user = await requireUser();

  const subtask = await db.subtask.findUnique({
    where: { id: subtaskId },
    include: {
      issue: {
        include: {
          project: { include: { team: { include: { members: true } } } },
        },
      },
    },
  });

  if (!subtask) {
    return { error: "Subtask not found" };
  }

  const membership = subtask.issue.project.team.members.find((m) => m.userId === user.id);
  if (!membership) {
    return { error: "Access denied" };
  }

  await db.subtask.delete({
    where: { id: subtaskId },
  });

  revalidatePath(`/projects/${subtask.issue.projectId}/issues/${subtask.issueId}`);
  return { success: true };
}

export async function reorderSubtasks(issueId: string, subtaskIds: string[]) {
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

  const membership = issue.project.team.members.find((m) => m.userId === user.id);
  if (!membership) {
    return { error: "Access denied" };
  }

  // Update order for each subtask
  await Promise.all(
    subtaskIds.map((id, index) =>
      db.subtask.update({
        where: { id },
        data: { order: index },
      })
    )
  );

  revalidatePath(`/projects/${issue.projectId}/issues/${issueId}`);
  return { success: true };
}

