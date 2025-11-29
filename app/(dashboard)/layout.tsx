import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";

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
    <div className="min-h-screen flex flex-col">
      <Navbar
        user={{
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        }}
      />
      <div className="flex flex-1">
        <Sidebar teams={teams} currentTeamId={teams[0]?.id} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

