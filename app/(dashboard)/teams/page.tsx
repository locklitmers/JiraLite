import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getInitials } from "@/lib/utils";

export default async function TeamsPage() {
  const user = await getUser();
  
  if (!user) {
    return null;
  }

  const teams = await db.team.findMany({
    where: {
      members: {
        some: { userId: user.id },
      },
    },
    include: {
      members: {
        include: { user: true },
        take: 5,
      },
      projects: {
        select: { id: true },
      },
      _count: {
        select: { members: true, projects: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get pending invites
  const pendingInvites = await db.teamInvite.findMany({
    where: { email: user.email },
    include: { team: true },
  });

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground mt-1">
            Manage your teams and collaborate with others.
          </p>
        </div>
        <Button asChild>
          <Link href="/teams/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Link>
        </Button>
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Pending Invitations</CardTitle>
            <CardDescription>
              You have been invited to join these teams
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-4 rounded-lg bg-background border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{invite.team.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Invited as {invite.role.toLowerCase()}
                    </p>
                  </div>
                </div>
                <Button asChild>
                  <Link href={`/teams/invite/${invite.token}`}>
                    Accept Invite
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No teams yet</h3>
            <p className="text-muted-foreground mt-2">
              Create your first team to start collaborating with others.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/teams/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Team
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            const userRole = team.members.find((m) => m.userId === user.id)?.role;
            return (
              <Card key={team.id} className="group hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    <Badge variant="secondary">{userRole}</Badge>
                  </div>
                  <CardTitle className="mt-4">{team.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {team.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{team._count.members} members</span>
                      <span>{team._count.projects} projects</span>
                    </div>
                    <div className="flex -space-x-2">
                      {team.members.slice(0, 3).map((member) => (
                        <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                          <AvatarImage src={member.user.avatarUrl || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(member.user.name)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {team._count.members > 3 && (
                        <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                          +{team._count.members - 3}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full mt-4 group-hover:bg-muted"
                    asChild
                  >
                    <Link href={`/teams/${team.slug}`}>
                      View Team
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

