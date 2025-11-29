"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, TrendingUp, Users, CheckCircle2, BarChart3 } from "lucide-react";
import Link from "next/link";
import { getInitials } from "@/lib/utils";

interface TeamStats {
  team: {
    id: string;
    name: string;
    slug: string;
  };
  members: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    assignedCount: number;
    completedCount: number;
  }[];
  projects: {
    id: string;
    name: string;
    key: string;
    statusCounts: { name: string; color: string; count: number }[];
  }[];
  trends: {
    date: string;
    created: number;
    completed: number;
  }[];
  totals: {
    totalIssues: number;
    completedIssues: number;
    openIssues: number;
    completionRate: number;
  };
}

export default function TeamStatisticsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const res = await fetch(`/api/teams/${slug}/statistics?days=${period}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch team statistics:", error);
      }
      setLoading(false);
    }
    fetchStats();
  }, [slug, period]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <p>Failed to load statistics</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/teams/${slug}`}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Team Statistics</h1>
            <p className="text-muted-foreground">{stats.team.name}</p>
          </div>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <BarChart3 className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Issues</p>
                <p className="text-2xl font-bold">{stats.totals.totalIssues}</p>
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
                <p className="text-2xl font-bold">{stats.totals.completedIssues}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-500/10">
                <TrendingUp className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold">{stats.totals.openIssues}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{stats.totals.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Issue Trends</CardTitle>
          <CardDescription>Created vs Completed issues over time</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.trends.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No data for this period</p>
          ) : (
            <div className="space-y-4">
              {/* Simple CSS-based chart */}
              <div className="flex items-end gap-1 h-40">
                {stats.trends.map((day, i) => {
                  const maxVal = Math.max(...stats.trends.map(d => Math.max(d.created, d.completed)), 1);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex gap-0.5 justify-center items-end h-32">
                        <div
                          className="w-2 bg-blue-500 rounded-t"
                          style={{ height: `${(day.created / maxVal) * 100}%`, minHeight: day.created > 0 ? '4px' : '0' }}
                          title={`Created: ${day.created}`}
                        />
                        <div
                          className="w-2 bg-green-500 rounded-t"
                          style={{ height: `${(day.completed / maxVal) * 100}%`, minHeight: day.completed > 0 ? '4px' : '0' }}
                          title={`Completed: ${day.completed}`}
                        />
                      </div>
                      {i % Math.ceil(stats.trends.length / 7) === 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded" />
                  <span>Created</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span>Completed</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Member Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Member Performance</CardTitle>
            <CardDescription>Issues assigned and completed per member</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.members.map((member) => (
                <div key={member.id} className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatarUrl || undefined} />
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{member.name || member.email}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{member.assignedCount} assigned</span>
                      <span>{member.completedCount} completed</span>
                    </div>
                  </div>
                  <div className="w-24">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{
                          width: `${member.assignedCount > 0 ? (member.completedCount / member.assignedCount) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right mt-1">
                      {member.assignedCount > 0 ? Math.round((member.completedCount / member.assignedCount) * 100) : 0}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Project Status */}
        <Card>
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
            <CardDescription>Issue distribution per project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {stats.projects.map((project) => (
                <div key={project.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{project.key}</Badge>
                    <span className="font-medium">{project.name}</span>
                  </div>
                  <div className="flex gap-1 h-6">
                    {project.statusCounts.map((status, i) => {
                      const total = project.statusCounts.reduce((sum, s) => sum + s.count, 0);
                      const width = total > 0 ? (status.count / total) * 100 : 0;
                      return width > 0 ? (
                        <div
                          key={i}
                          className="rounded-sm flex items-center justify-center text-[10px] text-white font-medium"
                          style={{ backgroundColor: status.color, width: `${width}%`, minWidth: status.count > 0 ? '20px' : '0' }}
                          title={`${status.name}: ${status.count}`}
                        >
                          {status.count}
                        </div>
                      ) : null;
                    })}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {project.statusCounts.map((status, i) => (
                      <div key={i} className="flex items-center gap-1 text-xs">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                        <span className="text-muted-foreground">{status.name}: {status.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

