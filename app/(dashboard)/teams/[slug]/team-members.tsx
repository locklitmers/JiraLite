"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Shield, User, Trash2, Clock, Crown } from "lucide-react";
import { getInitials, formatRelativeTime } from "@/lib/utils";
import { removeMember, updateMemberRole, leaveTeam, transferOwnership } from "../actions";
import { toast } from "sonner";
import type { Team, TeamMember, User as UserType, TeamInvite } from "@prisma/client";

interface TeamMembersProps {
  team: Team;
  members: (TeamMember & { user: UserType })[];
  invites: TeamInvite[];
  currentUserId: string;
  isAdmin: boolean;
}

export function TeamMembers({ team, members, invites, currentUserId, isAdmin }: TeamMembersProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleRemoveMember = async (memberId: string) => {
    setIsLoading(memberId);
    const result = await removeMember(team.id, memberId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Member removed successfully");
    }
    setIsLoading(null);
  };

  const handleUpdateRole = async (memberId: string, role: "ADMIN" | "MEMBER") => {
    setIsLoading(memberId);
    const result = await updateMemberRole(team.id, memberId, role);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Role updated successfully");
    }
    setIsLoading(null);
  };

  const handleLeaveTeam = async () => {
    setIsLoading("leave");
    const result = await leaveTeam(team.id);
    if (result?.error) {
      toast.error(result.error);
      setIsLoading(null);
    }
  };

  const handleTransferOwnership = async (newOwnerId: string) => {
    setIsLoading(`transfer-${newOwnerId}`);
    const result = await transferOwnership(team.id, newOwnerId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Ownership transferred successfully");
    }
    setIsLoading(null);
  };

  const currentUserMember = members.find((m) => m.userId === currentUserId);
  const isOwner = currentUserMember?.role === "OWNER";

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "OWNER":
        return "default";
      case "ADMIN":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {members.length} member{members.length !== 1 ? "s" : ""} in this team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 rounded-lg border"
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.user.avatarUrl || undefined} />
                  <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{member.user.name}</p>
                    {member.userId === currentUserId && (
                      <span className="text-xs text-muted-foreground">(you)</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{member.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={getRoleBadgeVariant(member.role)}>
                  {member.role}
                </Badge>
                {isAdmin && member.userId !== currentUserId && member.role !== "OWNER" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isLoading === member.id || isLoading === `transfer-${member.userId}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {member.role === "MEMBER" ? (
                        <DropdownMenuItem
                          onClick={() => handleUpdateRole(member.id, "ADMIN")}
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Make Admin
                        </DropdownMenuItem>
                      ) : (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleUpdateRole(member.id, "MEMBER")}
                          >
                            <User className="w-4 h-4 mr-2" />
                            Make Member
                          </DropdownMenuItem>
                          {isOwner && (
                            <DropdownMenuItem
                              onClick={() => handleTransferOwnership(member.userId)}
                              className="text-amber-600"
                            >
                              <Crown className="w-4 h-4 mr-2" />
                              Transfer Ownership
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {member.userId === currentUserId && member.role !== "OWNER" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLeaveTeam}
                    disabled={isLoading === "leave"}
                  >
                    Leave
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {invites.length > 0 && isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              {invites.length} pending invite{invites.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-muted/50"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Invited {formatRelativeTime(invite.createdAt)}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{invite.role}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

