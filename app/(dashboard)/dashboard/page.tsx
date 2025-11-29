import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FolderKanban, CheckCircle2, Clock, AlertCircle, Plus, ArrowRight, CalendarClock, Users, MessageSquare } from "lucide-react";
import Link from "next/link";
import { formatRelativeTime, getInitials, getPriorityColor, getTypeIcon, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getUser();
  
  if (!user) {
    return null;
  }

  const teamIds = user.teamMembers.map((tm) => tm.teamId);

  // Default values in case of error
  let projectCount = 0;
  let recentIssues: Awaited<ReturnType<typeof db.issue.findMany>> = [];
  let myAssignedIssues: Awaited<ReturnType<typeof db.issue.findMany>> = [];
  let issuesDueToday: Awaited<ReturnType<typeof db.issue.findMany>> = [];
  let issuesDueSoon: Awaited<ReturnType<typeof db.issue.findMany>> = [];
  let myRecentComments: Awaited<ReturnType<typeof db.issueComment.findMany>> = [];
  let issueStats = { open: 0, completed: 0, urgent: 0, myAssigned: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  try {
    // Single query to get project count
    projectCount = await db.project.count({
      where: { teamId: { in: teamIds }, deletedAt: null },
    });

    // Get recent issues with all needed data
    recentIssues = await db.issue.findMany({
      where: {
        project: { teamId: { in: teamIds } },
        deletedAt: null,
      },
      include: {
        project: true,
        status: true,
        assignee: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    // My assigned issues (not closed)
    myAssignedIssues = await db.issue.findMany({
      where: {
        assigneeId: user.id,
        status: { isClosed: false },
        deletedAt: null,
      },
      include: {
        project: true,
        status: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    // Issues due today
    issuesDueToday = await db.issue.findMany({
      where: {
        assigneeId: user.id,
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
        status: { isClosed: false },
        deletedAt: null,
      },
      include: {
        project: true,
        status: true,
      },
    });

    // Issues due within 7 days
    issuesDueSoon = await db.issue.findMany({
      where: {
        assigneeId: user.id,
        dueDate: {
          gte: today,
          lte: sevenDaysFromNow,
        },
        status: { isClosed: false },
        deletedAt: null,
      },
      include: {
        project: true,
        status: true,
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    });

    // Get all issues for stats calculation
    const allIssues = await db.issue.findMany({
      where: {
        project: { teamId: { in: teamIds } },
        deletedAt: null,
      },
      select: {
        priority: true,
        assigneeId: true,
        status: { select: { isClosed: true } },
      },
    });

    // Calculate stats from the single query result
    issueStats = allIssues.reduce(
      (acc, issue) => {
        if (issue.status.isClosed) {
          acc.completed++;
        } else {
          acc.open++;
          if (issue.priority === "URGENT") {
            acc.urgent++;
          }
        }
        if (issue.assigneeId === user.id && !issue.status.isClosed) {
          acc.myAssigned++;
        }
        return acc;
      },
      { open: 0, completed: 0, urgent: 0, myAssigned: 0 }
    );

    // My recent comments
    myRecentComments = await db.issueComment.findMany({
      where: {
        authorId: user.id,
        deletedAt: null,
        issue: {
          project: { teamId: { in: teamIds } },
          deletedAt: null,
        },
      },
      include: {
        issue: {
          include: { project: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    // Continue with default values
  }

  const stats = [
    {
      name: "My Assigned",
      value: issueStats.myAssigned,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      name: "Due Today",
      value: issuesDueToday.length,
      icon: CalendarClock,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      name: "Completed",
      value: issueStats.completed,
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      name: "Urgent",
      value: issueStats.urgent,
      icon: AlertCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user.name?.split(" ")[0] || "there"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your projects today.
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.name}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Assigned Issues */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Assigned Issues</CardTitle>
              <CardDescription>Issues assigned to you</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {myAssignedIssues.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No issues assigned to you
              </p>
            ) : (
              <div className="space-y-3">
                {myAssignedIssues.slice(0, 5).map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/projects/${issue.project.id}/issues/${issue.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <span>{getTypeIcon(issue.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{issue.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {issue.project.key}-{issue.number}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      style={{ borderColor: issue.status.color, color: issue.status.color }}
                      className="text-xs"
                    >
                      {issue.status.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Issues Due Soon */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5" />
                Due Soon
              </CardTitle>
              <CardDescription>Issues due within 7 days</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {issuesDueSoon.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No upcoming deadlines
              </p>
            ) : (
              <div className="space-y-3">
                {issuesDueSoon.map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/projects/${issue.project.id}/issues/${issue.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <span>{getTypeIcon(issue.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{issue.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {issue.project.key}-{issue.number}
                      </p>
                    </div>
                    <Badge
                      variant={
                        issue.dueDate && new Date(issue.dueDate) < tomorrow
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {issue.dueDate && formatDate(issue.dueDate)}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Issues */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your projects</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/projects">
              View all
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentIssues.length === 0 ? (
            <div className="text-center py-12">
              <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No issues yet</h3>
              <p className="text-muted-foreground mt-2">
                Create your first project to start tracking issues.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/projects/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentIssues.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/projects/${issue.project.id}/issues/${issue.id}`}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <span className="text-lg">{getTypeIcon(issue.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {issue.project.key}-{issue.number}
                      </span>
                      <Badge
                        variant="secondary"
                        className={getPriorityColor(issue.priority)}
                      >
                        {issue.priority}
                      </Badge>
                    </div>
                    <p className="font-medium truncate">{issue.title}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      style={{ borderColor: issue.status.color, color: issue.status.color }}
                    >
                      {issue.status.name}
                    </Badge>
                    {issue.assignee && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={issue.assignee.avatarUrl || undefined} />
                        <AvatarFallback>{getInitials(issue.assignee.name)}</AvatarFallback>
                      </Avatar>
                    )}
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(issue.updatedAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Recent Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            My Recent Comments
          </CardTitle>
          <CardDescription>Your latest comments on issues</CardDescription>
        </CardHeader>
        <CardContent>
          {myRecentComments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No comments yet
            </p>
          ) : (
            <div className="space-y-3">
              {myRecentComments.map((comment) => (
                <Link
                  key={comment.id}
                  href={`/projects/${comment.issue.project.id}/issues/${comment.issue.id}`}
                  className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span>{comment.issue.project.key}-{comment.issue.number}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm line-clamp-2" dangerouslySetInnerHTML={{ 
                    __html: comment.content.replace(/<[^>]*>/g, ' ').substring(0, 100) + (comment.content.length > 100 ? '...' : '')
                  }} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teams List */}
      <Card>
        <CardHeader>
          <CardTitle>My Teams</CardTitle>
          <CardDescription>Teams you belong to</CardDescription>
        </CardHeader>
        <CardContent>
          {user.teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground mt-2">You're not in any team yet</p>
              <Button className="mt-4" asChild>
                <Link href="/teams/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Team
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {user.teamMembers.map((tm) => (
                <Link
                  key={tm.id}
                  href={`/teams/${tm.team.slug}`}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {tm.team.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{tm.team.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {tm.role}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

