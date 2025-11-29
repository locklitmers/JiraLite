import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderKanban, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function ProjectsPage() {
  const user = await getUser();
  
  if (!user) {
    return null;
  }

  const teamIds = user.teamMembers.map((tm) => tm.teamId);

  const projects = await db.project.findMany({
    where: { teamId: { in: teamIds } },
    include: {
      team: true,
      _count: {
        select: { issues: true },
      },
      statuses: {
        include: {
          _count: { select: { issues: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your projects.
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
            <p className="text-muted-foreground mt-2">
              Create your first project to start tracking issues.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/projects/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const openIssues = project.statuses
              .filter((s) => !s.isClosed)
              .reduce((acc, s) => acc + s._count.issues, 0);
            const closedIssues = project.statuses
              .filter((s) => s.isClosed)
              .reduce((acc, s) => acc + s._count.issues, 0);

            return (
              <Card key={project.id} className="group hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{project.key}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {project.team.name}
                    </span>
                  </div>
                  <CardTitle className="mt-2">{project.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {project.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>{openIssues} open</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>{closedIssues} closed</span>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground">
                    Updated {formatDate(project.updatedAt)}
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full mt-4 group-hover:bg-muted"
                    asChild
                  >
                    <Link href={`/projects/${project.id}`}>
                      View Board
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

