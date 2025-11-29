"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  Plus,
  ChevronDown,
  CheckCircle,
  Kanban,
} from "lucide-react";

interface Team {
  id: string;
  name: string;
  slug: string;
}

interface SidebarProps {
  teams: Team[];
  currentTeamId?: string;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Teams", href: "/teams", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

function SidebarContent({ teams, currentTeamId, onNavigate, showLogo = false }: SidebarProps & { onNavigate?: () => void; showLogo?: boolean }) {
  const pathname = usePathname();
  const currentTeam = teams.find((t) => t.id === currentTeamId) || teams[0];

  return (
    <>
      {/* Mobile Logo - only show in mobile sidebar */}
      {showLogo && (
        <div className="p-4 border-b">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={onNavigate}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Kanban className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">Jira Lite</span>
          </Link>
        </div>
      )}

      {/* Team Selector */}
      <div className="p-4 border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between font-normal"
            >
              <span className="truncate">{currentTeam?.name || "Select Team"}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuLabel>Teams</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {teams.map((team) => (
              <DropdownMenuItem key={team.id} asChild>
                <Link
                  href={`/teams/${team.slug}`}
                  className="flex items-center justify-between"
                  onClick={onNavigate}
                >
                  <span>{team.name}</span>
                  {team.id === currentTeamId && (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/teams/new" className="flex items-center gap-2" onClick={onNavigate}>
                <Plus className="h-4 w-4" />
                Create Team
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="mt-8 px-3">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Quick Actions
          </p>
          <Button variant="outline" className="w-full justify-start gap-2" asChild>
            <Link href="/projects/new" onClick={onNavigate}>
              <Plus className="h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>
      </ScrollArea>
    </>
  );
}

export function Sidebar({ teams, currentTeamId, mobileOpen, onMobileOpenChange }: SidebarProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use external control if provided, otherwise use internal state
  const isOpen = mobileOpen !== undefined ? mobileOpen : internalOpen;
  const setIsOpen = onMobileOpenChange || setInternalOpen;

  return (
    <>
      {/* Mobile Sidebar Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            <SidebarContent 
              teams={teams} 
              currentTeamId={currentTeamId} 
              onNavigate={() => setIsOpen(false)}
              showLogo={true}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-muted/30 shrink-0">
        <SidebarContent teams={teams} currentTeamId={currentTeamId} />
      </aside>
    </>
  );
}

