"use client";

import { Button } from "@/components/ui/button";
import { Check, CheckCheck } from "lucide-react";
import { markNotificationRead, markAllNotificationsRead } from "./actions";
import { toast } from "sonner";

export function MarkReadButton({ notificationId }: { notificationId: string }) {
  async function handleClick() {
    const result = await markNotificationRead(notificationId);
    if (result.success) {
      toast.success("Marked as read");
    }
  }

  return (
    <Button variant="ghost" size="sm" className="h-auto p-0" onClick={handleClick}>
      <Check className="w-4 h-4 mr-1" />
      Mark read
    </Button>
  );
}

export function MarkAllReadButton() {
  async function handleClick() {
    const result = await markAllNotificationsRead();
    if (result.success) {
      toast.success("All notifications marked as read");
    }
  }

  return (
    <Button variant="outline" onClick={handleClick}>
      <CheckCheck className="w-4 h-4 mr-2" />
      Mark all read
    </Button>
  );
}

