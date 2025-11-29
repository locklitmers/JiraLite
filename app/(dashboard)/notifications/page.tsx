import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, MessageSquare, UserPlus, AlertCircle, FolderKanban } from "lucide-react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import { MarkAllReadButton, MarkReadButton } from "./notification-actions";

export default async function NotificationsPage() {
  const user = await getUser();
  
  if (!user) {
    return null;
  }

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "ISSUE_ASSIGNED":
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case "ISSUE_COMMENT":
        return <MessageSquare className="w-5 h-5 text-green-500" />;
      case "ISSUE_UPDATED":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "PROJECT_UPDATE":
        return <FolderKanban className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "You're all caught up!"}
          </p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No notifications</h3>
            <p className="text-muted-foreground mt-2">
              When you get notifications, they&apos;ll show up here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={notification.read ? "opacity-60" : ""}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-muted">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <Badge variant="default" className="shrink-0">New</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                      {notification.link && (
                        <Button variant="link" size="sm" className="h-auto p-0" asChild>
                          <Link href={notification.link}>View</Link>
                        </Button>
                      )}
                      {!notification.read && (
                        <MarkReadButton notificationId={notification.id} />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

