"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/get-user";
import { createTeamSchema, updateTeamSchema, inviteMemberSchema } from "@/lib/validations/team";
import { generateSlug } from "@/lib/utils";
import { sendEmail, getInviteEmailTemplate, getRemovedFromTeamEmailTemplate, getOwnershipTransferEmailTemplate, getRoleChangedEmailTemplate } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createTeam(formData: FormData) {
  const user = await requireUser();

  const rawData = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
  };

  const result = createTeamSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const { name, description } = result.data;
  let slug = generateSlug(name);

  // Ensure unique slug
  const existingTeam = await db.team.findUnique({ where: { slug } });
  if (existingTeam) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const team = await db.team.create({
    data: {
      name,
      slug,
      description,
      members: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
  });

  revalidatePath("/teams");
  redirect(`/teams/${team.slug}`);
}

export async function updateTeam(teamId: string, formData: FormData) {
  const user = await requireUser();

  // Check if user is admin or owner
  const membership = await db.teamMember.findFirst({
    where: {
      teamId,
      userId: user.id,
      role: { in: ["OWNER", "ADMIN"] },
    },
  });

  if (!membership) {
    return { error: "You don't have permission to update this team" };
  }

  const rawData = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
  };

  const result = updateTeamSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  await db.team.update({
    where: { id: teamId },
    data: result.data,
  });

  revalidatePath("/teams");
  return { success: true };
}

export async function deleteTeam(teamId: string) {
  const user = await requireUser();

  // Check if user is owner
  const membership = await db.teamMember.findFirst({
    where: {
      teamId,
      userId: user.id,
      role: "OWNER",
    },
  });

  if (!membership) {
    return { error: "Only the team owner can delete the team" };
  }

  await db.team.delete({
    where: { id: teamId },
  });

  revalidatePath("/teams");
  redirect("/teams");
}

export async function inviteMember(teamId: string, formData: FormData) {
  const user = await requireUser();

  // Check if user is admin or owner
  const membership = await db.teamMember.findFirst({
    where: {
      teamId,
      userId: user.id,
      role: { in: ["OWNER", "ADMIN"] },
    },
  });

  if (!membership) {
    return { error: "You don't have permission to invite members" };
  }

  const rawData = {
    email: formData.get("email") as string,
    role: formData.get("role") as "ADMIN" | "MEMBER",
  };

  const result = inviteMemberSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const { email, role } = result.data;

  // Check if already invited
  const existingInvite = await db.teamInvite.findFirst({
    where: { email, teamId },
  });

  if (existingInvite) {
    return { error: "This email has already been invited" };
  }

  // Check if already a member
  const existingMember = await db.teamMember.findFirst({
    where: {
      teamId,
      user: { email },
    },
  });

  if (existingMember) {
    return { error: "This user is already a member of the team" };
  }

  // Get team name for email
  const team = await db.team.findUnique({
    where: { id: teamId },
    select: { name: true },
  });

  // Create invite
  const invite = await db.teamInvite.create({
    data: {
      email,
      role,
      teamId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/teams/invite/${invite.token}`;

  // Send email
  if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    const emailResult = await sendEmail({
      to: email,
      subject: `You're invited to join ${team?.name || "a team"} on Jira Lite`,
      html: getInviteEmailTemplate(team?.name || "a team", inviteLink),
    });

    if (!emailResult.success) {
      console.error("Failed to send invite email");
    }
  }

  revalidatePath(`/teams`);
  return { success: "Invitation sent successfully", inviteLink };
}

export async function acceptInvite(token: string) {
  const user = await requireUser();

  const invite = await db.teamInvite.findUnique({
    where: { token },
    include: { team: true },
  });

  if (!invite) {
    return { error: "Invalid invitation" };
  }

  if (invite.email !== user.email) {
    return { error: "This invitation is for a different email address" };
  }

  if (invite.expiresAt < new Date()) {
    await db.teamInvite.delete({ where: { id: invite.id } });
    return { error: "This invitation has expired" };
  }

  // Create membership
  await db.teamMember.create({
    data: {
      userId: user.id,
      teamId: invite.teamId,
      role: invite.role,
    },
  });

  // Log activity
  await db.teamActivity.create({
    data: {
      teamId: invite.teamId,
      performerId: user.id,
      action: "MEMBER_JOINED",
      targetType: "user",
      targetId: user.id,
      targetName: user.name || user.email,
    },
  });

  // Delete invite
  await db.teamInvite.delete({ where: { id: invite.id } });

  revalidatePath("/teams");
  redirect(`/teams/${invite.team.slug}`);
}

export async function removeMember(teamId: string, memberId: string) {
  const user = await requireUser();

  // Check if user is admin or owner
  const membership = await db.teamMember.findFirst({
    where: {
      teamId,
      userId: user.id,
      role: { in: ["OWNER", "ADMIN"] },
    },
  });

  if (!membership) {
    return { error: "You don't have permission to remove members" };
  }

  const targetMember = await db.teamMember.findUnique({
    where: { id: memberId },
    include: {
      user: true,
      team: true,
    },
  });

  if (!targetMember) {
    return { error: "Member not found" };
  }

  // Can't remove owner
  if (targetMember.role === "OWNER") {
    return { error: "Cannot remove the team owner" };
  }

  // Admins can't remove other admins
  if (membership.role === "ADMIN" && targetMember.role === "ADMIN") {
    return { error: "Admins cannot remove other admins" };
  }

  await db.teamMember.delete({
    where: { id: memberId },
  });

  // Log activity
  await db.teamActivity.create({
    data: {
      teamId,
      performerId: user.id,
      action: "MEMBER_KICKED",
      targetType: "user",
      targetId: targetMember.userId,
      targetName: targetMember.user.name || targetMember.user.email,
    },
  });

  // Send email notification to removed member
  if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    const removedByRole = membership.role === "OWNER" ? "Owner" : "Admin";
    await sendEmail({
      to: targetMember.user.email,
      subject: `You've been removed from ${targetMember.team.name} - Jira Lite`,
      html: getRemovedFromTeamEmailTemplate(
        targetMember.user.name || targetMember.user.email,
        targetMember.team.name,
        user.name || user.email,
        removedByRole
      ),
    });
  }

  revalidatePath("/teams");
  return { success: true };
}

export async function updateMemberRole(teamId: string, memberId: string, role: "ADMIN" | "MEMBER") {
  const user = await requireUser();

  // Check if user is owner
  const membership = await db.teamMember.findFirst({
    where: {
      teamId,
      userId: user.id,
      role: "OWNER",
    },
  });

  if (!membership) {
    return { error: "Only the team owner can change member roles" };
  }

  const targetMember = await db.teamMember.findUnique({
    where: { id: memberId },
    include: { user: true },
  });

  if (!targetMember) {
    return { error: "Member not found" };
  }

  await db.teamMember.update({
    where: { id: memberId },
    data: { role },
  });

  const oldRole = targetMember.role;

  // Log activity
  await db.teamActivity.create({
    data: {
      teamId,
      performerId: user.id,
      action: "ROLE_CHANGED",
      targetType: "user",
      targetId: targetMember.userId,
      targetName: targetMember.user.name || targetMember.user.email,
      metadata: { oldRole, newRole: role },
    },
  });

  // Get team name for notification
  const team = await db.team.findUnique({ where: { id: teamId } });

  // Create notification for the member
  await db.notification.create({
    data: {
      userId: targetMember.userId,
      type: "TEAM_INVITE", // Using existing type for role changes
      title: "Role Changed",
      message: `Your role in ${team?.name} has been changed from ${oldRole} to ${role}`,
      link: `/teams/${team?.slug}`,
    },
  });

  // Send email notification
  if (team) {
    await sendEmail({
      to: targetMember.user.email,
      subject: `Your role in ${team.name} has changed - Jira Lite`,
      html: getRoleChangedEmailTemplate(
        targetMember.user.name || targetMember.user.email,
        team.name,
        oldRole,
        role,
        user.name || user.email
      ),
    });
  }

  revalidatePath("/teams");
  return { success: true };
}

export async function transferOwnership(teamId: string, newOwnerId: string) {
  const user = await requireUser();

  // Check if current user is the owner
  const currentOwnerMembership = await db.teamMember.findFirst({
    where: {
      teamId,
      userId: user.id,
      role: "OWNER",
    },
  });

  if (!currentOwnerMembership) {
    return { error: "Only the team owner can transfer ownership" };
  }

  // Check if new owner is an ADMIN in the team
  const newOwnerMembership = await db.teamMember.findFirst({
    where: {
      teamId,
      userId: newOwnerId,
      role: "ADMIN",
    },
    include: { user: true },
  });

  if (!newOwnerMembership) {
    return { error: "You can only transfer ownership to an Admin" };
  }

  const team = await db.team.findUnique({ where: { id: teamId } });
  if (!team) {
    return { error: "Team not found" };
  }

  // Perform the transfer in a transaction
  await db.$transaction([
    // Make current owner an ADMIN
    db.teamMember.update({
      where: { id: currentOwnerMembership.id },
      data: { role: "ADMIN" },
    }),
    // Make new owner the OWNER
    db.teamMember.update({
      where: { id: newOwnerMembership.id },
      data: { role: "OWNER" },
    }),
  ]);

  // Log activity
  await db.teamActivity.create({
    data: {
      teamId,
      performerId: user.id,
      action: "OWNERSHIP_TRANSFERRED",
      targetType: "user",
      targetId: newOwnerId,
      targetName: newOwnerMembership.user.name || newOwnerMembership.user.email,
      metadata: { previousOwner: user.name || user.email },
    },
  });

  // Create notification for new owner
  await db.notification.create({
    data: {
      userId: newOwnerId,
      type: "TEAM_INVITE",
      title: "You're now the Team Owner!",
      message: `${user.name || user.email} has transferred ownership of ${team.name} to you`,
      link: `/teams/${team.slug}`,
    },
  });

  // Send email to new owner
  await sendEmail({
    to: newOwnerMembership.user.email,
    subject: `You're now the owner of ${team.name} - Jira Lite`,
    html: getOwnershipTransferEmailTemplate(
      newOwnerMembership.user.name || newOwnerMembership.user.email,
      team.name,
      user.name || user.email
    ),
  });

  revalidatePath("/teams");
  return { success: true };
}

export async function leaveTeam(teamId: string) {
  const user = await requireUser();

  const membership = await db.teamMember.findFirst({
    where: {
      teamId,
      userId: user.id,
    },
  });

  if (!membership) {
    return { error: "You are not a member of this team" };
  }

  if (membership.role === "OWNER") {
    return { error: "Team owners cannot leave. Transfer ownership or delete the team." };
  }

  await db.teamMember.delete({
    where: { id: membership.id },
  });

  revalidatePath("/teams");
  redirect("/teams");
}

export async function getTeamActivities(teamId: string) {
  const user = await requireUser();

  // Check membership
  const membership = await db.teamMember.findFirst({
    where: { teamId, userId: user.id },
  });

  if (!membership) {
    return { error: "Access denied" };
  }

  const activities = await db.teamActivity.findMany({
    where: { teamId },
    include: {
      performer: {
        select: {
          name: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return { activities };
}

// Helper function to log team activity
export async function logTeamActivity(
  teamId: string,
  performerId: string,
  action: string,
  targetType: string,
  targetName: string,
  targetId?: string,
  metadata?: any
) {
  await db.teamActivity.create({
    data: {
      teamId,
      performerId,
      action,
      targetType,
      targetName,
      targetId,
      metadata,
    },
  });
}

