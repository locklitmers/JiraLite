"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/get-user";
import { revalidatePath } from "next/cache";

export async function markNotificationRead(notificationId: string) {
  const user = await requireUser();

  await db.notification.updateMany({
    where: {
      id: notificationId,
      userId: user.id,
    },
    data: { read: true },
  });

  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllNotificationsRead() {
  const user = await requireUser();

  await db.notification.updateMany({
    where: {
      userId: user.id,
      read: false,
    },
    data: { read: true },
  });

  revalidatePath("/notifications");
  return { success: true };
}

export async function deleteNotification(notificationId: string) {
  const user = await requireUser();

  await db.notification.deleteMany({
    where: {
      id: notificationId,
      userId: user.id,
    },
  });

  revalidatePath("/notifications");
  return { success: true };
}

