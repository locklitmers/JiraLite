"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProject } from "../actions";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { generateProjectKey } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
}

function NewProjectForm() {
  const searchParams = useSearchParams();
  const defaultTeamId = searchParams.get("team");
  
  const [isLoading, setIsLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");

  useEffect(() => {
    // Fetch teams
    fetch("/api/teams")
      .then((res) => res.json())
      .then((data) => setTeams(data))
      .catch(() => toast.error("Failed to load teams"));
  }, []);

  useEffect(() => {
    if (name && !key) {
      setKey(generateProjectKey(name));
    }
  }, [name, key]);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    const result = await createProject(formData);
    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link
        href="/projects"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to projects
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create a new project</CardTitle>
          <CardDescription>
            Projects help you organize and track issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="teamId">Team</Label>
              <Select name="teamId" defaultValue={defaultTeamId || undefined} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="My Project"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key">Project Key</Label>
                <Input
                  id="key"
                  name="key"
                  placeholder="PROJ"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  maxLength={10}
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Used as prefix for issue IDs (e.g., PROJ-1)
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="What is this project about?"
                rows={4}
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Project
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/projects">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <NewProjectForm />
    </Suspense>
  );
}

