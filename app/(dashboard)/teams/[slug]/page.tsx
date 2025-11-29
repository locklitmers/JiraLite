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
    <div className="p-6 space-y-6">
      <Link
        href="/teams"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to teams
      </Link>

      {/* Team Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
            {team.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{team.name}</h1>
            <p className="text-muted-foreground mt-1">
              {team.description || "No description"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/teams/${team.slug}/statistics`}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Statistics
            </Link>
          </Button>
          {isAdmin && <InviteMemberDialog teamId={team.id} />}
        </div>
      </div>

      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList>
          <TabsTrigger value="projects" className="gap-2">
            <FolderKanban className="w-4 h-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="w-4 h-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="w-4 h-4" />
            Activity
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          )}
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Projects</h2>
              <p className="text-sm text-muted-foreground">
                {team.projects.length} project{team.projects.length !== 1 ? "s" : ""} in this team
              </p>
            </div>
            <Button asChild>
              <Link href={`/projects/new?team=${team.id}`}>
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Link>
            </Button>
          </div>

          {team.projects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
                <p className="text-muted-foreground mt-2">
                  Create your first project in this team.
                </p>
                <Button className="mt-4" asChild>
                  <Link href={`/projects/new?team=${team.id}`}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {team.projects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{project.key}</Badge>
                    </div>
                    <CardTitle className="mt-2">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{project._count.issues} issues</span>
                      <span>Created {formatDate(project.createdAt)}</span>
                    </div>
                    <Button variant="ghost" className="w-full mt-4" asChild>
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

