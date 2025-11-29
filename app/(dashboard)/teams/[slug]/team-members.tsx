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
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Team Members</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {members.length} member{members.length !== 1 ? "s" : ""} in this team
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-3 sm:space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg border gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-9 w-9 sm:h-10 sm:w-10 shrink-0">
                  <AvatarImage src={member.user.avatarUrl || undefined} />
                  <AvatarFallback className="text-xs sm:text-sm">{getInitials(member.user.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm sm:text-base truncate">{member.user.name}</p>
                    {member.userId === currentUserId && (
                      <span className="text-xs text-muted-foreground">(you)</span>
                    )}
                    <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs shrink-0">
                      {member.role}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{member.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 justify-end shrink-0">
                {isAdmin && member.userId !== currentUserId && member.role !== "OWNER" && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
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
                    className="text-xs sm:text-sm h-8"
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
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Pending Invitations</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {invites.length} pending invite{invites.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-3 sm:space-y-4">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg border bg-muted/50 gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base truncate">{invite.email}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Invited {formatRelativeTime(invite.createdAt)}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs w-fit shrink-0">{invite.role}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

