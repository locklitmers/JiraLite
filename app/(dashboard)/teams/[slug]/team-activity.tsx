"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  UserPlus, 
  UserMinus, 
  Shield, 
  FolderPlus, 
  Trash2, 
  Archive,
  Settings,
  Activity,
  Loader2
} from "lucide-react";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { getTeamActivities } from "../actions";

interface TeamActivityProps {
  teamId: string;
}

interface ActivityItem {
  id: string;
  action: string;
  targetType: string;
  targetName: string;
  metadata: any;
  createdAt: Date;
  performer: {
    name: string | null;
    avatarUrl: string | null;
  };
}

export function TeamActivity({ teamId }: TeamActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadActivities() {
      setIsLoading(true);
      const result = await getTeamActivities(teamId);
      if (result.activities) {
        setActivities(result.activities);
      }
      setIsLoading(false);
    }
    loadActivities();
  }, [teamId]);

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "MEMBER_JOINED":
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case "MEMBER_LEFT":
      case "MEMBER_KICKED":
        return <UserMinus className="w-4 h-4 text-red-500" />;
      case "ROLE_CHANGED":
        return <Shield className="w-4 h-4 text-blue-500" />;
      case "OWNERSHIP_TRANSFERRED":
        return <Shield className="w-4 h-4 text-amber-500" />;
      case "PROJECT_CREATED":
        return <FolderPlus className="w-4 h-4 text-purple-500" />;
      case "PROJECT_DELETED":
        return <Trash2 className="w-4 h-4 text-red-500" />;
      case "PROJECT_ARCHIVED":
        return <Archive className="w-4 h-4 text-yellow-500" />;
      case "TEAM_UPDATED":
        return <Settings className="w-4 h-4 text-gray-500" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActivityMessage = (activity: ActivityItem) => {
    switch (activity.action) {
      case "MEMBER_JOINED":
        return `joined the team`;
      case "MEMBER_LEFT":
        return `left the team`;
      case "MEMBER_KICKED":
        return `removed ${activity.targetName} from the team`;
      case "ROLE_CHANGED":
        return `changed ${activity.targetName}'s role to ${activity.metadata?.newRole || "unknown"}`;
      case "OWNERSHIP_TRANSFERRED":
        return `transferred ownership to ${activity.targetName}`;
      case "PROJECT_CREATED":
        return `created project "${activity.targetName}"`;
      case "PROJECT_DELETED":
        return `deleted project "${activity.targetName}"`;
      case "PROJECT_ARCHIVED":
        return `${activity.metadata?.archived ? "archived" : "restored"} project "${activity.targetName}"`;
      case "TEAM_UPDATED":
        return `updated team settings`;
      default:
        return activity.action;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto opacity-50 mb-4" />
            <p>No activity recorded yet</p>
            <p className="text-sm mt-1">Activities will appear here as team members take actions</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50"
                >
                  <div className="p-2 rounded-full bg-muted">
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={activity.performer.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(activity.performer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">
                        {activity.performer.name || "Unknown"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {getActivityMessage(activity)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
