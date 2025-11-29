"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createIssue } from "./issues/actions";
import { Loader2, Plus, Sparkles, AlertTriangle, X, Check } from "lucide-react";
import { toast } from "sonner";
import type { IssueStatus, User } from "@prisma/client";
import Link from "next/link";

type ProjectLabel = {
  id: string;
  name: string;
  color: string;
};

interface CreateIssueDialogProps {
  projectId: string;
  statuses: IssueStatus[];
  teamMembers: User[];
  currentUserId: string;
  labels?: ProjectLabel[];
}

interface DuplicateIssue {
  id: string;
  number: number;
  title: string;
  status: string;
  isClosed: boolean;
  link: string;
}

const issueTypes = [
  { value: "TASK", label: "Task" },
  { value: "BUG", label: "Bug" },
  { value: "FEATURE", label: "Feature" },
  { value: "STORY", label: "Story" },
  { value: "EPIC", label: "Epic" },
];

const priorities = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export function CreateIssueDialog({
  projectId,
  statuses,
  teamMembers,
  currentUserId,
  labels = [],
}: CreateIssueDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  // AI Features state
  const [suggestedLabels, setSuggestedLabels] = useState<ProjectLabel[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [loadingLabels, setLoadingLabels] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateIssue[]>([]);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);
  const [ignoreDuplicates, setIgnoreDuplicates] = useState(false);
  
  const router = useRouter();
  const defaultStatus = statuses.find((s) => s.isDefault) || statuses[0];

  // Check for duplicates when title changes (debounced)
  useEffect(() => {
    if (!title || title.length < 5) {
      setDuplicates([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingDuplicates(true);
      try {
        const res = await fetch("/api/ai/duplicate-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, title, description }),
        });
        const data = await res.json();
        if (data.duplicates) {
          setDuplicates(data.duplicates);
          setIgnoreDuplicates(false);
        }
      } catch (error) {
        console.error("Duplicate check failed:", error);
      }
      setLoadingDuplicates(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [title, projectId]);

  async function handleAutoLabel() {
    if (!title) {
      toast.error("Please enter a title first");
      return;
    }

    setLoadingLabels(true);
    try {
      const res = await fetch("/api/ai/auto-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, title, description }),
      });
      const data = await res.json();
      
      if (data.rateLimited) {
        toast.error(`Rate limited. Try again in ${data.resetIn} seconds.`);
      } else if (data.error) {
        toast.error(data.error);
      } else if (data.labels && data.labels.length > 0) {
        setSuggestedLabels(data.labels);
        toast.success(`Found ${data.labels.length} suggested labels`);
      } else {
        toast.info("No label suggestions for this issue");
      }
    } catch (error) {
      toast.error("Failed to get label suggestions");
    }
    setLoadingLabels(false);
  }

  function acceptLabel(labelId: string) {
    if (!selectedLabels.includes(labelId) && selectedLabels.length < 5) {
      setSelectedLabels([...selectedLabels, labelId]);
    }
    setSuggestedLabels(suggestedLabels.filter(l => l.id !== labelId));
  }

  function rejectLabel(labelId: string) {
    setSuggestedLabels(suggestedLabels.filter(l => l.id !== labelId));
  }

  function removeSelectedLabel(labelId: string) {
    setSelectedLabels(selectedLabels.filter(id => id !== labelId));
  }

  async function handleSubmit(formData: FormData) {
    // Check for duplicates warning
    if (duplicates.length > 0 && !ignoreDuplicates) {
      toast.error("Please review potential duplicates first, or click 'Ignore' to proceed");
      return;
    }

    setIsLoading(true);
    formData.append("projectId", projectId);
    
    // Add selected labels
    selectedLabels.forEach(labelId => {
      formData.append("labelIds", labelId);
    });
    
    const result = await createIssue(formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Issue created successfully");
      setIsOpen(false);
      resetForm();
      router.refresh();
    }
    setIsLoading(false);
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setSuggestedLabels([]);
    setSelectedLabels([]);
    setDuplicates([]);
    setIgnoreDuplicates(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Issue
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Issue</DialogTitle>
          <DialogDescription>
            Add a new issue to track in this project.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Issue title"
              required
              disabled={isLoading}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {loadingDuplicates && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Checking for duplicates...
              </p>
            )}
          </div>

          {/* Duplicate Warning */}
          {duplicates.length > 0 && !ignoreDuplicates && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Potential duplicates found:</p>
                  <ul className="space-y-1">
                    {duplicates.map((dup) => (
                      <li key={dup.id} className="flex items-center justify-between text-sm">
                        <Link 
                          href={dup.link} 
                          target="_blank"
                          className="hover:underline flex-1"
                        >
                          #{dup.number}: {dup.title}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {dup.status}
                          </Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIgnoreDuplicates(true)}
                  >
                    Ignore and continue
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue="TASK">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {issueTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue="MEDIUM">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="statusId">Status</Label>
              <Select name="statusId" defaultValue={defaultStatus?.id}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        {status.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigneeId">Assignee</Label>
              <Select name="assigneeId">
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (Optional)</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the issue..."
              rows={5}
              disabled={isLoading}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* AI Labels Section */}
          {labels.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Labels</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoLabel}
                  disabled={loadingLabels || !title}
                >
                  {loadingLabels ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  AI Suggest Labels
                </Button>
              </div>

              {/* Selected Labels */}
              {selectedLabels.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedLabels.map((labelId) => {
                    const label = labels.find(l => l.id === labelId);
                    if (!label) return null;
                    return (
                      <Badge
                        key={label.id}
                        style={{ backgroundColor: label.color, color: "white" }}
                        className="gap-1 pr-1"
                      >
                        {label.name}
                        <button
                          type="button"
                          onClick={() => removeSelectedLabel(label.id)}
                          className="hover:bg-white/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}

              {/* AI Suggested Labels */}
              {suggestedLabels.length > 0 && (
                <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    AI Suggested Labels:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedLabels.map((label) => (
                      <div key={label.id} className="flex items-center gap-1">
                        <Badge
                          style={{ backgroundColor: label.color, color: "white" }}
                        >
                          {label.name}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => acceptLabel(label.id)}
                        >
                          <Check className="w-4 h-4 text-green-500" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => rejectLabel(label.id)}
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Label Selection */}
              {selectedLabels.length < 5 && (
                <Select
                  onValueChange={(value) => {
                    if (!selectedLabels.includes(value)) {
                      setSelectedLabels([...selectedLabels, value]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add a label..." />
                  </SelectTrigger>
                  <SelectContent>
                    {labels
                      .filter(l => !selectedLabels.includes(l.id))
                      .map((label) => (
                        <SelectItem key={label.id} value={label.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: label.color }}
                            />
                            {label.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Issue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
