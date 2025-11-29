"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/get-user";
import { createProjectSchema, updateProjectSchema, createStatusSchema, updateStatusOrderSchema } from "@/lib/validations/project";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProject(formData: FormData) {
  const user = await requireUser();

  const rawData = {
    name: formData.get("name") as string,
    key: (formData.get("key") as string).toUpperCase(),
    description: formData.get("description") as string,
    teamId: formData.get("teamId") as string,
  };

  const result = createProjectSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const { name, key, description, teamId } = result.data;

  // Check if user is a member of the team
  const membership = await db.teamMember.findFirst({
    where: {
      teamId,
      userId: user.id,
    },
  });

  if (!membership) {
    return { error: "You are not a member of this team" };
  }

  // Check if key is unique within team
  const existingProject = await db.project.findFirst({
    where: { teamId, key },
  });

  if (existingProject) {
    return { error: "A project with this key already exists in this team" };
  }

  const project = await db.project.create({
    data: {
      name,
      key,
      description,
      teamId,
      statuses: {
        createMany: {
          data: [
            { name: "To Do", color: "#6B7280", order: 0, isDefault: true },
            { name: "In Progress", color: "#3B82F6", order: 1 },
            { name: "In Review", color: "#F59E0B", order: 2 },
            { name: "Done", color: "#10B981", order: 3, isClosed: true },
          ],
        },
      },
    },
  });

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateProject(projectId: string, formData: FormData) {
  const user = await requireUser();

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { team: { include: { members: true } } },
  });

  if (!project) {
    return { error: "Project not found" };
  }

  const membership = project.team.members.find((m) => m.userId === user.id);
  if (!membership || membership.role === "MEMBER") {
    return { error: "You don't have permission to update this project" };
  }

  const rawData = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
  };

  const result = updateProjectSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  await db.project.update({
    where: { id: projectId },
    data: result.data,
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function deleteProject(projectId: string) {
  const user = await requireUser();

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { team: { include: { members: true } } },
  });

  if (!project) {
    return { error: "Project not found" };
  }

  const membership = project.team.members.find((m) => m.userId === user.id);
  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    return { error: "You don't have permission to delete this project" };
  }

  await db.project.delete({
    where: { id: projectId },
  });

  revalidatePath("/projects");
  redirect("/projects");
}

export async function createStatus(projectId: string, formData: FormData) {
  const user = await requireUser();

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { 
      team: { include: { members: true } },
      statuses: { orderBy: { order: "desc" }, take: 1 },
    },
  });

  if (!project) {
    return { error: "Project not found" };
  }

  const membership = project.team.members.find((m) => m.userId === user.id);
  if (!membership) {
    return { error: "You don't have permission to modify this project" };
  }

  const maxOrder = project.statuses[0]?.order ?? -1;
  const wipLimitStr = formData.get("wipLimit") as string;
  const wipLimit = wipLimitStr ? parseInt(wipLimitStr, 10) : null;

  const rawData = {
    name: formData.get("name") as string,
    color: formData.get("color") as string || "#6B7280",
    order: maxOrder + 1,
    isDefault: false,
    isClosed: formData.get("isClosed") === "true",
  };

  const result = createStatusSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  // Validate WIP limit
  if (wipLimit !== null && (wipLimit < 1 || wipLimit > 50)) {
    return { error: "WIP limit must be between 1 and 50" };
  }

  await db.issueStatus.create({
    data: {
      ...result.data,
      wipLimit,
      projectId,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function updateStatusOrder(projectId: string, data: { statuses: { id: string; order: number }[] }) {
  const user = await requireUser();

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { team: { include: { members: true } } },
  });

  if (!project) {
    return { error: "Project not found" };
  }

  const membership = project.team.members.find((m) => m.userId === user.id);
  if (!membership) {
    return { error: "You don't have permission to modify this project" };
  }

  const result = updateStatusOrderSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  await db.$transaction(
    result.data.statuses.map((status) =>
      db.issueStatus.update({
        where: { id: status.id },
        data: { order: status.order },
      })
    )
  );

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function deleteStatus(statusId: string) {
  const user = await requireUser();

  const status = await db.issueStatus.findUnique({
    where: { id: statusId },
    include: {
      project: { include: { team: { include: { members: true } }, statuses: true } },
      _count: { select: { issues: true } },
    },
  });

  if (!status) {
    return { error: "Status not found" };
  }

  const membership = status.project.team.members.find((m) => m.userId === user.id);
  if (!membership) {
    return { error: "You don't have permission to modify this project" };
  }

  if (status.isDefault) {
    return { error: "Cannot delete the default status" };
  }

  if (status._count.issues > 0) {
    return { error: "Cannot delete a status with issues. Move issues first." };
  }

  if (status.project.statuses.length <= 1) {
    return { error: "Cannot delete the last status" };
  }

  await db.issueStatus.delete({
    where: { id: statusId },
  });

  revalidatePath(`/projects/${status.projectId}`);
  return { success: true };
}

export async function archiveProject(projectId: string) {
  const user = await requireUser();

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { team: { include: { members: true } } },
  });

  if (!project) {
    return { error: "Project not found" };
  }

  const membership = project.team.members.find((m) => m.userId === user.id);
  if (!membership || membership.role === "MEMBER") {
    return { error: "You don't have permission to archive this project" };
  }

  await db.project.update({
    where: { id: projectId },
    data: { archived: !project.archived },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  return { success: true, archived: !project.archived };
}

export async function toggleFavorite(projectId: string) {
  const user = await requireUser();

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { team: { include: { members: true } } },
  });

  if (!project) {
    return { error: "Project not found" };
  }

  const membership = project.team.members.find((m) => m.userId === user.id);
  if (!membership) {
    return { error: "You don't have access to this project" };
  }

  const existingFavorite = await db.projectFavorite.findUnique({
    where: {
      userId_projectId: {
        userId: user.id,
        projectId,
      },
    },
  });

  if (existingFavorite) {
    await db.projectFavorite.delete({
      where: { id: existingFavorite.id },
    });
  } else {
    await db.projectFavorite.create({
      data: {
        userId: user.id,
        projectId,
      },
    });
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  return { success: true, isFavorite: !existingFavorite };
}

