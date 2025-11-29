import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Archive } from "lucide-react";
import Link from "next/link";
import { ProjectSettingsForm } from "./project-settings-form";
import { StatusManager } from "./status-manager";
import { LabelManager } from "./label-manager";
import { ArchiveProjectButton } from "./archive-project-button";

interface ProjectSettingsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  const { id } = await params;
  const user = await getUser();
  
  if (!user) {
    return null;
  }

  const project = await db.project.findUnique({
    where: { id },
    include: {
      team: {
        include: {
          members: true,
        },
      },
      statuses: {
        orderBy: { order: "asc" },
        include: {
          _count: { select: { issues: true } },
        },
      },
      labels: {
        orderBy: { name: "asc" },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const membership = project.team.members.find((m) => m.userId === user.id);
  if (!membership || membership.role === "MEMBER") {
    notFound();
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/projects/${project.id}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Project Settings</h1>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
      </div>

      <ProjectSettingsForm project={project} />

      <StatusManager projectId={project.id} statuses={project.statuses} />
      
      <LabelManager projectId={project.id} labels={project.labels} />

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Archive Project</p>
              <p className="text-sm text-muted-foreground">
                {project.archived 
                  ? "Restore this project to make it active again"
                  : "Archive this project to make it read-only"}
              </p>
            </div>
            <ArchiveProjectButton projectId={project.id} archived={project.archived} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

