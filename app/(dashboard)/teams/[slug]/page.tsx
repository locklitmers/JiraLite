import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, FolderKanban, Plus, ArrowLeft, Activity, BarChart3 } from "lucide-react";
import Link from "next/link";
import { getInitials, formatDate } from "@/lib/utils";
import { TeamMembers } from "./team-members";
import { TeamSettings } from "./team-settings";
import { InviteMemberDialog } from "./invite-member-dialog";
import { TeamActivity } from "./team-activity";

interface TeamPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { slug } = await params;
  const user = await getUser();
  
  if (!user) {
    return null;
  }

  const team = await db.team.findUnique({
    where: { slug },
    include: {
      members: {
        include: { user: true },
        orderBy: [
          { role: "asc" },
          { createdAt: "asc" },
        ],
      },
      projects: {
        include: {
          _count: { select: { issues: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      invites: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!team) {
    notFound();
  }

  const membership = team.members.find((m) => m.userId === user.id);
  if (!membership) {
    notFound();
  }

  const isAdmin = membership.role === "OWNER" || membership.role === "ADMIN";

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <Link
        href="/teams"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to teams
      </Link>

      {/* Team Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl sm:text-2xl shrink-0">
            {team.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold truncate">{team.name}</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base truncate">
              {team.description || "No description"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm">
            <Link href={`/teams/${team.slug}/statistics`}>
              <BarChart3 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Statistics</span>
            </Link>
          </Button>
          {isAdmin && <InviteMemberDialog teamId={team.id} />}
        </div>
      </div>

      <Tabs defaultValue="projects" className="space-y-4 sm:space-y-6">
        <TabsList className="w-full sm:w-auto overflow-x-auto flex-nowrap justify-start">
          <TabsTrigger value="projects" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <FolderKanban className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Projects</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Members</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Activity</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="settings" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
              <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Settings</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">Projects</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {team.projects.length} project{team.projects.length !== 1 ? "s" : ""} in this team
              </p>
            </div>
            <Button asChild size="sm" className="w-full sm:w-auto">
              <Link href={`/projects/new?team=${team.id}`}>
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Link>
            </Button>
          </div>

          {team.projects.length === 0 ? (
            <Card>
              <CardContent className="py-8 sm:py-12 text-center">
                <FolderKanban className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-base sm:text-lg font-semibold">No projects yet</h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  Create your first project in this team.
                </p>
                <Button className="mt-4" size="sm" asChild>
                  <Link href={`/projects/new?team=${team.id}`}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {team.projects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{project.key}</Badge>
                    </div>
                    <CardTitle className="mt-2 text-base sm:text-lg">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2 text-xs sm:text-sm">
                      {project.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                    <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                      <span>{project._count.issues} issues</span>
                      <span>Created {formatDate(project.createdAt)}</span>
                    </div>
                    <Button variant="ghost" className="w-full mt-3 sm:mt-4" size="sm" asChild>
                      <Link href={`/projects/${project.id}`}>View Project</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <TeamMembers
            team={team}
            members={team.members}
            invites={team.invites}
            currentUserId={user.id}
            isAdmin={isAdmin}
          />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <TeamActivity teamId={team.id} />
        </TabsContent>

        {/* Settings Tab */}
        {isAdmin && (
          <TabsContent value="settings">
            <TeamSettings team={team} isOwner={membership.role === "OWNER"} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

