"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/get-user";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createLabelSchema = z.object({
  name: z.string().min(1, "Name is required").max(30),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  projectId: z.string().min(1),
});

const updateLabelSchema = z.object({
  name: z.string().min(1).max(30).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export async function createLabel(formData: FormData) {
  const user = await requireUser();

  const rawData = {
    name: formData.get("name") as string,
    color: formData.get("color") as string,
    projectId: formData.get("projectId") as string,
  };

  const result = createLabelSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const { name, color, projectId } = result.data;

  // Check access
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { team: { include: { members: true } } },
  });

  if (!project) {
    return { error: "Project not found" };
  }

  const membership = project.team.members.find((m) => m.userId === user.id);
  if (!membership) {
    return { error: "Access denied" };
  }

  // Check max labels (20)
  const labelCount = await db.label.count({ where: { projectId } });
  if (labelCount >= 20) {
    return { error: "Maximum 20 labels allowed per project" };
  }

  // Check duplicate name
  const existingLabel = await db.label.findUnique({
    where: { projectId_name: { projectId, name } },
  });

  if (existingLabel) {
    return { error: "Label with this name already exists" };
  }

  const label = await db.label.create({
    data: {
      name,
      color,
      projectId,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true, label };
}

export async function updateLabel(labelId: string, data: { name?: string; color?: string }) {
  const user = await requireUser();

  const result = updateLabelSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const label = await db.label.findUnique({
    where: { id: labelId },
    include: {
      project: { include: { team: { include: { members: true } } } },
    },
  });

  if (!label) {
    return { error: "Label not found" };
  }

  const membership = label.project.team.members.find((m) => m.userId === user.id);
  if (!membership) {
    return { error: "Access denied" };
  }

  // Check duplicate name if changing name
  if (result.data.name && result.data.name !== label.name) {
    const existingLabel = await db.label.findUnique({
      where: { projectId_name: { projectId: label.projectId, name: result.data.name } },
    });
    if (existingLabel) {
      return { error: "Label with this name already exists" };
    }
  }

  await db.label.update({
    where: { id: labelId },
    data: result.data,
  });

  revalidatePath(`/projects/${label.projectId}`);
  return { success: true };
}

export async function deleteLabel(labelId: string) {
  const user = await requireUser();

  const label = await db.label.findUnique({
    where: { id: labelId },
    include: {
      project: { include: { team: { include: { members: true } } } },
    },
  });

  if (!label) {
    return { error: "Label not found" };
  }

  const membership = label.project.team.members.find((m) => m.userId === user.id);
  if (!membership) {
    return { error: "Access denied" };
  }

  await db.label.delete({
    where: { id: labelId },
  });

  revalidatePath(`/projects/${label.projectId}`);
  return { success: true };
}

export async function addLabelToIssue(issueId: string, labelId: string) {
  const user = await requireUser();

  const issue = await db.issue.findUnique({
    where: { id: issueId },
    include: {
      project: { include: { team: { include: { members: true } } } },
      labels: true,
    },
  });

  if (!issue) {
    return { error: "Issue not found" };
  }

  const membership = issue.project.team.members.find((m) => m.userId === user.id);
  if (!membership) {
    return { error: "Access denied" };
  }

  // Check max labels per issue (5)
  if (issue.labels.length >= 5) {
    return { error: "Maximum 5 labels allowed per issue" };
  }

  // Check if already added
  const existing = await db.issueLabel.findUnique({
    where: { issueId_labelId: { issueId, labelId } },
  });

  if (existing) {
    return { error: "Label already added to this issue" };
  }

  await db.issueLabel.create({
    data: { issueId, labelId },
  });

  revalidatePath(`/projects/${issue.projectId}/issues/${issueId}`);
  return { success: true };
}

export async function removeLabelFromIssue(issueId: string, labelId: string) {
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

  await db.issueLabel.delete({
    where: { issueId_labelId: { issueId, labelId } },
  });

  revalidatePath(`/projects/${issue.projectId}/issues/${issueId}`);
  return { success: true };
}

