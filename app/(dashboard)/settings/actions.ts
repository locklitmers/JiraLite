"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/get-user";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function updateProfile(formData: FormData) {
  const user = await requireUser();

  const rawData = {
    name: formData.get("name") as string,
  };

  const result = updateProfileSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  await db.user.update({
    where: { id: user.id },
    data: { name: result.data.name },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function changePassword(formData: FormData) {
  const user = await requireUser();

  const rawData = {
    currentPassword: formData.get("currentPassword") as string,
    newPassword: formData.get("newPassword") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const result = changePasswordSchema.safeParse(rawData);
  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const { currentPassword, newPassword } = result.data;
  const supabase = await createClient();

  // Verify current password by trying to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return { error: "Current password is incorrect" };
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { error: updateError.message };
  }

  // Sign out user so they need to login with new password
  await supabase.auth.signOut();

  return { success: true, shouldLogout: true };
}

export async function deleteAccount(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  // Check if user owns any teams
  const ownedTeams = await db.teamMember.findMany({
    where: {
      userId: user.id,
      role: "OWNER",
    },
    include: { team: true },
  });

  if (ownedTeams.length > 0) {
    const teamNames = ownedTeams.map((t) => t.team.name).join(", ");
    return {
      error: `You own the following teams: ${teamNames}. Please transfer ownership or delete them first.`,
    };
  }

  // For non-OAuth users, verify password
  const password = formData.get("password") as string;
  if (password) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (signInError) {
      return { error: "Password is incorrect" };
    }
  }

  // Store user ID before deletion
  const userId = user.id;

  // Sign out first
  await supabase.auth.signOut();

  try {
    // Delete user from Supabase Auth using Admin API
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createAdminClient();
      const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
      
      if (deleteAuthError) {
        console.error("Error deleting user from Supabase Auth:", deleteAuthError);
        // Continue with database deletion even if Auth deletion fails
      }
    }

    // Hard delete user from database (xóa hoàn toàn)
    await db.user.delete({
      where: { id: userId },
    });

    // Return success - let client component handle redirect
    // Don't use redirect() here as it throws an error that gets caught in try/catch
    return { success: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return { error: "Failed to delete account. Please try again." };
  }
}

