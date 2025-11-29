import { notFound, redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { db } from "@/lib/db";
import { IssueDetail } from "./issue-detail";

interface IssuePageProps {
  params: Promise<{ id: string; issueId: string }>;
}

export default async function IssuePage({ params }: IssuePageProps) {
  const { id: projectId, issueId } = await params;
  const user = await getUser();
  
  if (!user) {
    redirect("/auth/signin");
  }

  const issue = await db.issue.findUnique({
    where: { id: issueId },
    include: {
      project: {
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
          },
          labels: true,
        },
      },
      status: true,
      assignee: true,
      reporter: true,
      comments: {
        where: { deletedAt: null },
        include: { author: true },
        orderBy: { createdAt: "desc" },
      },
      activities: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      subtasks: {
        orderBy: { order: "asc" },
      },
      labels: {
        include: { label: true },
      },
    },
  });

  if (!issue || issue.projectId !== projectId) {
    notFound();
  }

  const membership = issue.project.team.members.find((m) => m.userId === user.id);
  if (!membership) {
    notFound();
  }

  const teamMembers = issue.project.team.members.map((m) => m.user);

  return (
    <IssueDetail
      issue={issue}
      statuses={issue.project.statuses}
      teamMembers={teamMembers}
      currentUserId={user.id}
      projectKey={issue.project.key}
      projectLabels={issue.project.labels}
      isArchived={issue.project.archived}
    />
  );
}

