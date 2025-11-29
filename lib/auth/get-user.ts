import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { cache } from "react";

export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  try {
    const user = await db.user.findUnique({
      where: { id: authUser.id },
      include: {
        teamMembers: {
          include: {
            team: true,
          },
        },
      },
    });

    return user;
  } catch (error) {
    console.error("Failed to fetch user from database:", error);
    return null;
  }
});

export const requireUser = cache(async () => {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
});

