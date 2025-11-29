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

  const teamIds = user.teamMembers.map((tm: any) => tm.teamId);

  // Default values in case of error
  let projectCount = 0;
  let recentIssues: any[] = [];
  let myAssignedIssues: any[] = [];
  let issuesDueToday: any[] = [];
  let issuesDueSoon: any[] = [];
  let myRecentComments: any[] = [];
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
        project: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
        status: {
          select: {
            id: true,
            name: true,
            color: true,
            isClosed: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
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
        project: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
        status: {
          select: {
            id: true,
            name: true,
            color: true,
            isClosed: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
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
        project: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
        status: {
          select: {
            id: true,
            name: true,
            color: true,
            isClosed: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
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
        project: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
        status: {
          select: {
            id: true,
            name: true,
            color: true,
            isClosed: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
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
      (acc: any, issue: any) => {
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
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        issueId: true,
        authorId: true,
        issue: {
          select: {
            id: true,
            number: true,
            title: true,
            project: {
              select: {
                id: true,
                key: true,
                name: true,
              },
            },
          },
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
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Welcome back, {user.name?.split(" ")[0] || "there"}!
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Here&apos;s what&apos;s happening with your projects today.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/projects/new">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`p-2 sm:p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{stat.name}</p>
                  <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* My Assigned Issues */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">My Assigned Issues</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Issues assigned to you</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            {myAssignedIssues.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm">
                No issues assigned to you
              </p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {myAssignedIssues.slice(0, 5).map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/projects/${issue.project.id}/issues/${issue.id}`}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm">{getTypeIcon(issue.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-xs sm:text-sm">{issue.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {issue.project.key}-{issue.number}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      style={{ borderColor: issue.status.color, color: issue.status.color }}
                      className="text-xs shrink-0"
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
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CalendarClock className="w-4 h-4 sm:w-5 sm:h-5" />
              Due Soon
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Issues due within 7 days</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            {issuesDueSoon.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm">
                No upcoming deadlines
              </p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {issuesDueSoon.map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/projects/${issue.project.id}/issues/${issue.id}`}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm">{getTypeIcon(issue.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-xs sm:text-sm">{issue.title}</p>
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
                      className="text-xs shrink-0"
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
        <CardHeader className="p-4 sm:p-6 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Latest updates from your projects</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-xs sm:text-sm">
            <Link href="/projects">
              View all
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {recentIssues.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <FolderKanban className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 text-base sm:text-lg font-semibold">No issues yet</h3>
              <p className="text-muted-foreground mt-2 text-sm">
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
            <div className="space-y-3 sm:space-y-4">
              {recentIssues.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/projects/${issue.project.id}/issues/${issue.id}`}
                  className="block p-3 sm:p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  {/* Mobile Layout */}
                  <div className="flex items-start gap-3">
                    <span className="text-base sm:text-lg shrink-0">{getTypeIcon(issue.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {issue.project.key}-{issue.number}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`${getPriorityColor(issue.priority)} text-xs`}
                        >
                          {issue.priority}
                        </Badge>
                        <Badge
                          variant="outline"
                          style={{ borderColor: issue.status.color, color: issue.status.color }}
                          className="text-xs"
                        >
                          {issue.status.name}
                        </Badge>
                      </div>
                      <p className="font-medium truncate text-sm sm:text-base mt-1">{issue.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {issue.assignee && (
                          <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                            <AvatarImage src={issue.assignee.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs">{getInitials(issue.assignee.name)}</AvatarFallback>
                          </Avatar>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(issue.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Recent Comments */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            My Recent Comments
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Your latest comments on issues</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {myRecentComments.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm">
              No comments yet
            </p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {myRecentComments.map((comment) => (
                <Link
                  key={comment.id}
                  href={`/projects/${comment.issue.project.id}/issues/${comment.issue.id}`}
                  className="block p-2 sm:p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span>{comment.issue.project.key}-{comment.issue.number}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(comment.createdAt)}</span>
                  </div>
                  <p className="text-xs sm:text-sm line-clamp-2" dangerouslySetInnerHTML={{ 
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
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">My Teams</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Teams you belong to</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {user.teamMembers.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground mt-2 text-sm">You're not in any team yet</p>
              <Button className="mt-4" asChild>
                <Link href="/teams/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Team
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {user.teamMembers.map((tm: any) => (
                <Link
                  key={tm.id}
                  href={`/teams/${tm.team.slug}`}
                  className="flex items-center gap-3 p-2 sm:p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base">
                    {tm.team.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm sm:text-base">{tm.team.name}</p>
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

