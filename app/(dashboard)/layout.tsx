import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const teams = user.teamMembers.map((tm) => tm.team);

  return (
    <DashboardShell
      user={{
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      }}
      teams={teams}
      currentTeamId={teams[0]?.id}
    >
      {children}
    </DashboardShell>
  );
}

