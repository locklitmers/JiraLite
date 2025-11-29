"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter, X, ArrowUpDown } from "lucide-react";
import type { IssueStatus, User } from "@prisma/client";

type Label = {
  id: string;
  name: string;
  color: string;
};

interface IssueFiltersProps {
  statuses: IssueStatus[];
  teamMembers: User[];
  labels: Label[];
}

export function IssueFilters({ statuses, teamMembers, labels }: IssueFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [assignee, setAssignee] = useState(searchParams.get("assignee") || "");
  const [priority, setPriority] = useState(searchParams.get("priority") || "");
  const [label, setLabel] = useState(searchParams.get("label") || "");
  const [hasDueDate, setHasDueDate] = useState(searchParams.get("hasDueDate") === "true");
  const [dueDateRange, setDueDateRange] = useState(searchParams.get("dueDateRange") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "");

  const activeFilters = [status, assignee, priority, label, hasDueDate ? "hasDueDate" : "", dueDateRange].filter(Boolean).length;

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    setSearch("");
    setStatus("");
    setAssignee("");
    setPriority("");
    setLabel("");
    setHasDueDate(false);
    setDueDateRange("");
    setSortBy("");
    router.push(pathname);
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateParams("search", search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search issues..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 w-[200px]"
        />
      </div>

      {/* Sort */}
      <Select
        value={sortBy || "default"}
        onValueChange={(v) => {
          const val = v === "default" ? "" : v;
          setSortBy(val);
          updateParams("sortBy", val);
        }}
      >
        <SelectTrigger className="w-[160px]">
          <ArrowUpDown className="w-4 h-4 mr-2" />
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Default</SelectItem>
          <SelectItem value="created_desc">Newest first</SelectItem>
          <SelectItem value="created_asc">Oldest first</SelectItem>
          <SelectItem value="updated_desc">Recently updated</SelectItem>
          <SelectItem value="dueDate_asc">Due date (earliest)</SelectItem>
          <SelectItem value="dueDate_desc">Due date (latest)</SelectItem>
          <SelectItem value="priority_desc">Priority (high first)</SelectItem>
          <SelectItem value="priority_asc">Priority (low first)</SelectItem>
        </SelectContent>
      </Select>

      {/* Filters Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
            {activeFilters > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5">
                {activeFilters}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={status || "all"}
                onValueChange={(v) => {
                  const val = v === "all" ? "" : v;
                  setStatus(val);
                  updateParams("status", val);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        {s.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Assignee</label>
              <Select
                value={assignee || "all"}
                onValueChange={(v) => {
                  const val = v === "all" ? "" : v;
                  setAssignee(val);
                  updateParams("assignee", val);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All assignees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All assignees</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name || m.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={priority || "all"}
                onValueChange={(v) => {
                  const val = v === "all" ? "" : v;
                  setPriority(val);
                  updateParams("priority", val);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {labels.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Label</label>
                <Select
                  value={label || "all"}
                  onValueChange={(v) => {
                    const val = v === "all" ? "" : v;
                    setLabel(val);
                    updateParams("label", val);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All labels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All labels</SelectItem>
                    {labels.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: l.color }}
                          />
                          {l.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Due Date Filters */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <div className="flex items-center space-x-2 mb-2">
                <Checkbox
                  id="hasDueDate"
                  checked={hasDueDate}
                  onCheckedChange={(checked) => {
                    setHasDueDate(checked === true);
                    updateParams("hasDueDate", checked ? "true" : "");
                  }}
                />
                <label htmlFor="hasDueDate" className="text-sm">
                  Has due date
                </label>
              </div>
              <Select
                value={dueDateRange || "all"}
                onValueChange={(v) => {
                  const val = v === "all" ? "" : v;
                  setDueDateRange(val);
                  updateParams("dueDateRange", val);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any time</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="today">Due today</SelectItem>
                  <SelectItem value="week">Due this week</SelectItem>
                  <SelectItem value="month">Due this month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {activeFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={clearFilters}
              >
                <X className="w-4 h-4 mr-2" />
                Clear all filters
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Active filter badges */}
      {activeFilters > 0 && (
        <div className="flex items-center gap-1">
          {status && (
            <Badge variant="secondary" className="gap-1">
              {statuses.find((s) => s.id === status)?.name}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => {
                  setStatus("");
                  updateParams("status", "");
                }}
              />
            </Badge>
          )}
          {assignee && (
            <Badge variant="secondary" className="gap-1">
              {assignee === "unassigned"
                ? "Unassigned"
                : teamMembers.find((m) => m.id === assignee)?.name || "Assignee"}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => {
                  setAssignee("");
                  updateParams("assignee", "");
                }}
              />
            </Badge>
          )}
          {priority && (
            <Badge variant="secondary" className="gap-1">
              {priority}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => {
                  setPriority("");
                  updateParams("priority", "");
                }}
              />
            </Badge>
          )}
          {label && (
            <Badge variant="secondary" className="gap-1">
              {labels.find((l) => l.id === label)?.name}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => {
                  setLabel("");
                  updateParams("label", "");
                }}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

