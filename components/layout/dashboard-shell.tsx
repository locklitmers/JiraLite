"use client";

import { useState } from "react";
import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";

interface Team {
  id: string;
  name: string;
  slug: string;
}

interface DashboardShellProps {
  user: {
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
  teams: Team[];
  currentTeamId?: string;
  children: React.ReactNode;
}

export function DashboardShell({ user, teams, currentTeamId, children }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar - Sticky at top */}
      <div className="sticky top-0 z-50">
        <Navbar
          user={user}
          onMobileMenuClick={() => setMobileMenuOpen(true)}
        />
      </div>
      <div className="flex flex-1">
        <Sidebar 
          teams={teams} 
          currentTeamId={currentTeamId}
          mobileOpen={mobileMenuOpen}
          onMobileOpenChange={setMobileMenuOpen}
        />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

