"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { formatRelativeTime, getPriorityColor, getTypeIcon } from "@/lib/utils";
import { CheckCircle2, Clock, AlertCircle, Calendar } from "lucide-react";
import type { Issue, IssueStatus, User } from "@prisma/client";

interface ProjectDashboardProps {
  projectId: string;
  projectKey: string;
  statuses: (IssueStatus & {
    issues: (Issue & {
      assignee: User | null;
    })[];
  })[];
}

export function ProjectDashboard({ projectId, projectKey, statuses }: ProjectDashboardProps) {
  // Calculate stats
  const allIssues = statuses.flatMap((s) => s.issues);
  const totalIssues = allIssues.length;
  const completedIssues = statuses.filter((s) => s.isClosed).flatMap((s) => s.issues).length;
  const completionRate = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

  // Issues by priority
  const priorityStats = {
    URGENT: allIssues.filter((i) => i.priority === "URGENT").length,
    HIGH: allIssues.filter((i) => i.priority === "HIGH").length,
    MEDIUM: allIssues.filter((i) => i.priority === "MEDIUM").length,
    LOW: allIssues.filter((i) => i.priority === "LOW").length,
  };

  // Recent issues (last 5)
  const recentIssues = [...allIssues]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Issues due soon (within 7 days)
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const issuesDueSoon = allIssues
    .filter((i) => i.dueDate && new Date(i.dueDate) <= sevenDaysFromNow && new Date(i.dueDate) >= now)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <CheckCircle2 className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Issues</p>
                <p className="text-2xl font-bold">{totalIssues}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedIssues}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{totalIssues - completedIssues}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-500/10">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold">{priorityStats.URGENT}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Completion Rate */}
        <Card>
          <CardHeader>
            <CardTitle>Completion Rate</CardTitle>
            <CardDescription>Overall project progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold">{completionRate}%</span>
                <span className="text-sm text-muted-foreground">
                  {completedIssues} of {totalIssues} issues
                </span>
              </div>
              <Progress value={completionRate} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Issues by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Issues by Status</CardTitle>
            <CardDescription>Distribution across columns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statuses.map((status) => {
                const percentage = totalIssues > 0 ? (status.issues.length / totalIssues) * 100 : 0;
                return (
                  <div key={status.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        <span>{status.name}</span>
                      </div>
                      <span className="text-muted-foreground">{status.issues.length}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: status.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Issues by Priority */}
        <Card>
          <CardHeader>
            <CardTitle>Issues by Priority</CardTitle>
            <CardDescription>Priority distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(priorityStats).map(([priority, count]) => (
                <div
                  key={priority}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <Badge className={getPriorityColor(priority as any)}>
                    {priority}
                  </Badge>
                  <span className="text-xl font-bold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Due Soon */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Due Soon
            </CardTitle>
            <CardDescription>Issues due within 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {issuesDueSoon.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No issues due soon
              </p>
            ) : (
              <div className="space-y-2">
                {issuesDueSoon.map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/projects/${projectId}/issues/${issue.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>{getTypeIcon(issue.type)}</span>
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {issue.title}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {issue.dueDate && formatRelativeTime(issue.dueDate)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Created</CardTitle>
          <CardDescription>Latest issues in this project</CardDescription>
        </CardHeader>
        <CardContent>
          {recentIssues.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No issues yet
            </p>
          ) : (
            <div className="space-y-2">
              {recentIssues.map((issue) => {
                const status = statuses.find((s) => s.id === issue.statusId);
                return (
                  <Link
                    key={issue.id}
                    href={`/projects/${projectId}/issues/${issue.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getTypeIcon(issue.type)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {projectKey}-{issue.number}
                          </span>
                          <Badge className={getPriorityColor(issue.priority)}>
                            {issue.priority}
                          </Badge>
                        </div>
                        <p className="font-medium">{issue.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {status && (
                        <Badge
                          variant="outline"
                          style={{ borderColor: status.color, color: status.color }}
                        >
                          {status.name}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(issue.createdAt)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

