"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { createStatus, deleteStatus } from "../../actions";
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import type { IssueStatus } from "@prisma/client";

interface StatusManagerProps {
  projectId: string;
  statuses: (IssueStatus & { _count: { issues: number } })[];
}

export function StatusManager({ projectId, statuses }: StatusManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreateStatus(formData: FormData) {
    setIsLoading(true);
    const result = await createStatus(projectId, formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Status created successfully");
      setIsOpen(false);
    }
    setIsLoading(false);
  }

  async function handleDeleteStatus(statusId: string) {
    setDeletingId(statusId);
    const result = await deleteStatus(statusId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Status deleted successfully");
    }
    setDeletingId(null);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Issue Statuses</CardTitle>
            <CardDescription>
              Manage the columns in your Kanban board
            </CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Status
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Status</DialogTitle>
                <DialogDescription>
                  Create a new status column for your Kanban board.
                </DialogDescription>
              </DialogHeader>
              <form action={handleCreateStatus} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Status Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Testing"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      name="color"
                      type="color"
                      defaultValue="#6B7280"
                      className="w-16 h-10 p-1"
                      disabled={isLoading}
                    />
                    <Input
                      name="colorHex"
                      defaultValue="#6B7280"
                      placeholder="#6B7280"
                      className="flex-1"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wipLimit">WIP Limit (optional)</Label>
                  <Input
                    id="wipLimit"
                    name="wipLimit"
                    type="number"
                    min="1"
                    max="50"
                    placeholder="Leave empty for unlimited"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of issues allowed in this column (1-50)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isClosed"
                    name="isClosed"
                    value="true"
                    className="rounded"
                  />
                  <Label htmlFor="isClosed" className="font-normal">
                    Mark issues in this status as closed
                  </Label>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Status
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {statuses.map((status) => (
            <div
              key={status.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                <span className="font-medium">{status.name}</span>
                {status.isDefault && (
                  <Badge variant="secondary" className="text-xs">Default</Badge>
                )}
                {status.isClosed && (
                  <Badge variant="outline" className="text-xs">Closed</Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {status._count.issues}{status.wipLimit ? `/${status.wipLimit}` : ""} issues
                </span>
                {status.wipLimit && (
                  <Badge variant="outline" className="text-xs">
                    WIP: {status.wipLimit}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDeleteStatus(status.id)}
                  disabled={deletingId === status.id || status.isDefault}
                >
                  {deletingId === status.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

