import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Create demo users
  const user1 = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      id: "user_alice",
      email: "alice@example.com",
      name: "Alice Johnson",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      id: "user_bob",
      email: "bob@example.com",
      name: "Bob Smith",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: "charlie@example.com" },
    update: {},
    create: {
      id: "user_charlie",
      email: "charlie@example.com",
      name: "Charlie Brown",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=charlie",
    },
  });

  console.log("✅ Created users");

  // Create team
  const team = await prisma.team.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      id: "team_acme",
      name: "Acme Corp",
      slug: "acme-corp",
      description: "Building the future of project management",
    },
  });

  // Add team members
  await prisma.teamMember.upsert({
    where: { userId_teamId: { userId: user1.id, teamId: team.id } },
    update: {},
    create: {
      userId: user1.id,
      teamId: team.id,
      role: "OWNER",
    },
  });

  await prisma.teamMember.upsert({
    where: { userId_teamId: { userId: user2.id, teamId: team.id } },
    update: {},
    create: {
      userId: user2.id,
      teamId: team.id,
      role: "ADMIN",
    },
  });

  await prisma.teamMember.upsert({
    where: { userId_teamId: { userId: user3.id, teamId: team.id } },
    update: {},
    create: {
      userId: user3.id,
      teamId: team.id,
      role: "MEMBER",
    },
  });

  console.log("✅ Created team with members");

  // Create project
  const project = await prisma.project.upsert({
    where: { teamId_key: { teamId: team.id, key: "JIRA" } },
    update: {},
    create: {
      id: "project_jira",
      name: "Jira Lite Development",
      key: "JIRA",
      description: "Building a lightweight issue management tool",
      teamId: team.id,
    },
  });

  // Create statuses
  const statuses = await Promise.all([
    prisma.issueStatus.upsert({
      where: { projectId_name: { projectId: project.id, name: "Backlog" } },
      update: {},
      create: {
        name: "Backlog",
        color: "#6B7280",
        order: 0,
        isDefault: true,
        projectId: project.id,
      },
    }),
    prisma.issueStatus.upsert({
      where: { projectId_name: { projectId: project.id, name: "To Do" } },
      update: {},
      create: {
        name: "To Do",
        color: "#8B5CF6",
        order: 1,
        projectId: project.id,
      },
    }),
    prisma.issueStatus.upsert({
      where: { projectId_name: { projectId: project.id, name: "In Progress" } },
      update: {},
      create: {
        name: "In Progress",
        color: "#3B82F6",
        order: 2,
        projectId: project.id,
      },
    }),
    prisma.issueStatus.upsert({
      where: { projectId_name: { projectId: project.id, name: "In Review" } },
      update: {},
      create: {
        name: "In Review",
        color: "#F59E0B",
        order: 3,
        projectId: project.id,
      },
    }),
    prisma.issueStatus.upsert({
      where: { projectId_name: { projectId: project.id, name: "Done" } },
      update: {},
      create: {
        name: "Done",
        color: "#10B981",
        order: 4,
        isClosed: true,
        projectId: project.id,
      },
    }),
  ]);

  console.log("✅ Created project with statuses");

  // Create issues
  const issues = [
    {
      title: "Set up authentication with Supabase",
      description: "<p>Implement email/password and Google OAuth authentication using Supabase Auth.</p><ul><li>Sign up flow</li><li>Sign in flow</li><li>Password reset</li><li>OAuth integration</li></ul>",
      type: "FEATURE" as const,
      priority: "HIGH" as const,
      statusIndex: 4, // Done
      assigneeId: user1.id,
    },
    {
      title: "Create Kanban board component",
      description: "<p>Build a drag-and-drop Kanban board for visualizing issues across different statuses.</p><p>Requirements:</p><ul><li>Drag issues between columns</li><li>Reorder columns</li><li>Smooth animations</li></ul>",
      type: "FEATURE" as const,
      priority: "HIGH" as const,
      statusIndex: 3, // In Review
      assigneeId: user2.id,
    },
    {
      title: "Bug: Issue modal not closing on save",
      description: "<p>When saving an issue from the modal, the modal doesn't close automatically. User has to manually close it.</p><p><strong>Steps to reproduce:</strong></p><ol><li>Open an issue</li><li>Make changes</li><li>Click Save</li><li>Modal stays open</li></ol>",
      type: "BUG" as const,
      priority: "MEDIUM" as const,
      statusIndex: 2, // In Progress
      assigneeId: user3.id,
    },
    {
      title: "Add AI-powered issue summarization",
      description: "<p>Integrate OpenAI to provide:</p><ul><li>Issue summaries</li><li>Improvement suggestions</li><li>Auto-tagging</li></ul>",
      type: "FEATURE" as const,
      priority: "MEDIUM" as const,
      statusIndex: 2, // In Progress
      assigneeId: user1.id,
    },
    {
      title: "Implement real-time notifications",
      description: "<p>Use Supabase Realtime to push notifications when:</p><ul><li>Issue is assigned</li><li>Comment is added</li><li>Issue status changes</li></ul>",
      type: "FEATURE" as const,
      priority: "HIGH" as const,
      statusIndex: 1, // To Do
      assigneeId: user2.id,
    },
    {
      title: "Design system documentation",
      description: "<p>Create documentation for our Shadcn UI component library usage and custom components.</p>",
      type: "TASK" as const,
      priority: "LOW" as const,
      statusIndex: 0, // Backlog
      assigneeId: null,
    },
    {
      title: "Performance optimization for large boards",
      description: "<p>Optimize rendering for boards with 100+ issues. Consider virtualization.</p>",
      type: "TASK" as const,
      priority: "LOW" as const,
      statusIndex: 0, // Backlog
      assigneeId: null,
    },
    {
      title: "Add keyboard shortcuts",
      description: "<p>Implement keyboard shortcuts for common actions:</p><ul><li><code>c</code> - Create issue</li><li><code>j/k</code> - Navigate issues</li><li><code>e</code> - Edit issue</li><li><code>?</code> - Show shortcuts</li></ul>",
      type: "FEATURE" as const,
      priority: "LOW" as const,
      statusIndex: 0, // Backlog
      assigneeId: null,
    },
  ];

  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    await prisma.issue.upsert({
      where: { projectId_number: { projectId: project.id, number: i + 1 } },
      update: {},
      create: {
        number: i + 1,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        priority: issue.priority,
        projectId: project.id,
        statusId: statuses[issue.statusIndex].id,
        reporterId: user1.id,
        assigneeId: issue.assigneeId,
      },
    });
  }

  console.log("✅ Created issues");

  // Add some comments
  const firstIssue = await prisma.issue.findFirst({
    where: { projectId: project.id, number: 1 },
  });

  if (firstIssue) {
    await prisma.issueComment.create({
      data: {
        issueId: firstIssue.id,
        authorId: user2.id,
        content: "<p>Great work on this! The OAuth flow is working smoothly. Just tested with Google and it's seamless.</p>",
      },
    });

    await prisma.issueComment.create({
      data: {
        issueId: firstIssue.id,
        authorId: user3.id,
        content: "<p>Should we add support for GitHub OAuth as well? Many developers prefer that option.</p>",
      },
    });

    await prisma.issueComment.create({
      data: {
        issueId: firstIssue.id,
        authorId: user1.id,
        content: "<p>Good idea @Charlie! I'll add it to the backlog for v2.</p>",
      },
    });
  }

  console.log("✅ Created comments");

  // Create notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: user2.id,
        type: "ISSUE_ASSIGNED",
        title: "Issue Assigned",
        message: "You were assigned to JIRA-2: Create Kanban board component",
        link: `/projects/${project.id}`,
      },
      {
        userId: user3.id,
        type: "ISSUE_ASSIGNED",
        title: "Issue Assigned",
        message: "You were assigned to JIRA-3: Bug: Issue modal not closing on save",
        link: `/projects/${project.id}`,
      },
    ],
  });

  console.log("✅ Created notifications");

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

