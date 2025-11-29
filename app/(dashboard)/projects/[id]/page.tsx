import { notFound } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { KanbanBoard } from "./kanban-board";
import { ProjectDashboard } from "./project-dashboard";
import { IssueFilters } from "./issue-filters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, ArrowLeft, LayoutGrid, BarChart3, Star, Archive } from "lucide-react";
import Link from "next/link";
import { CreateIssueDialog } from "./create-issue-dialog";
import { FavoriteButton } from "./favorite-button";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function ProjectPage({ params, searchParams }: ProjectPageProps) {
  const { id } = await params;
  const filters = await searchParams;
  const user = await getUser();
  
  if (!user) {
    return null;
  }

  // Build issue filter conditions
  const issueWhere: any = { deletedAt: null };
  if (filters.search) {
    issueWhere.title = { contains: filters.search, mode: "insensitive" };
  }
  if (filters.status) {
    issueWhere.statusId = filters.status;
  }
  if (filters.assignee === "unassigned") {
    issueWhere.assigneeId = null;
  } else if (filters.assignee) {
    issueWhere.assigneeId = filters.assignee;
  }
  if (filters.priority) {
    issueWhere.priority = filters.priority;
  }
  if (filters.label) {
    issueWhere.labels = { some: { labelId: filters.label } };
  }
  if (filters.hasDueDate === "true") {
    issueWhere.dueDate = { not: null };
  }
  if (filters.dueDateRange) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const monthEnd = new Date(today);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    switch (filters.dueDateRange) {
      case "overdue":
        issueWhere.dueDate = { lt: today };
        break;
      case "today":
        issueWhere.dueDate = { gte: today, lt: tomorrow };
        break;
      case "week":
        issueWhere.dueDate = { gte: today, lt: weekEnd };
        break;
      case "month":
        issueWhere.dueDate = { gte: today, lt: monthEnd };
        break;
    }
  }

  // Build sort order
  let issueOrderBy: any = { createdAt: "desc" };
  if (filters.sortBy) {
    const [field, direction] = filters.sortBy.split("_");
    if (field === "created") {
      issueOrderBy = { createdAt: direction };
    } else if (field === "updated") {
      issueOrderBy = { updatedAt: direction };
    } else if (field === "dueDate") {
      issueOrderBy = { dueDate: direction };
    } else if (field === "priority") {
      // Priority sorting needs special handling
      issueOrderBy = { priority: direction };
    }
  }

  const project = await db.project.findUnique({
    where: { id },
    include: {
      team: {
        include: {
          members: {
            include: { user: true },
          },
        },
      },
      statuses: {
        orderBy: { order: "asc" },
        include: {
          issues: {
            where: issueWhere,
            orderBy: issueOrderBy,
            include: {
              assignee: true,
              reporter: true,
              subtasks: true,
              labels: {
                include: { label: true },
              },
            },
          },
        },
      },
      labels: true,
      favorites: {
        where: { userId: user.id },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const membership = project.team.members.find((m: { userId: string }) => m.userId === user.id);
  if (!membership) {
    notFound();
  }

  const isAdmin = membership.role === "OWNER" || membership.role === "ADMIN";
  const teamMembers = project.team.members.map((m: { user: any }) => m.user);
  const isFavorite = project.favorites.length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link
              href="/projects"
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs shrink-0">{project.key}</Badge>
                <h1 className="text-base sm:text-xl font-bold truncate">{project.name}</h1>
                {project.archived && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    <Archive className="w-3 h-3 mr-1" />
                    Archived
                  </Badge>
                )}
                <FavoriteButton projectId={project.id} isFavorite={isFavorite} />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                {project.team.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 justify-end">
            {!project.archived && (
              <CreateIssueDialog
                projectId={project.id}
                statuses={project.statuses}
                teamMembers={teamMembers}
                currentUserId={user.id}
                labels={project.labels}
              />
            )}
            {isAdmin && (
              <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                <Link href={`/projects/${project.id}/settings`}>
                  <Settings className="w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="board" className="flex-1 flex flex-col">
        <div className="border-b px-3 sm:px-6 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="board" className="gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none">
              <LayoutGrid className="w-3 h-3 sm:w-4 sm:h-4" />
              Board
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
              Dashboard
            </TabsTrigger>
          </TabsList>
          <IssueFilters
            statuses={project.statuses}
            teamMembers={teamMembers}
            labels={project.labels}
          />
        </div>

        <TabsContent value="board" className="flex-1 overflow-hidden m-0">
          <KanbanBoard
            projectId={project.id}
            statuses={project.statuses}
            projectKey={project.key}
            isArchived={project.archived}
          />
        </TabsContent>

        <TabsContent value="dashboard" className="flex-1 overflow-auto m-0">
          <ProjectDashboard
            projectId={project.id}
            projectKey={project.key}
            statuses={project.statuses}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

