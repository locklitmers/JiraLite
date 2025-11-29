"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createSubtask, updateSubtask, deleteSubtask } from "./subtasks/actions";
import { Plus, Trash2, Loader2, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import type { Subtask } from "@prisma/client";

interface SubtaskListProps {
  issueId: string;
  subtasks: Subtask[];
  isArchived?: boolean;
}

export function SubtaskList({ issueId, subtasks, isArchived = false }: SubtaskListProps) {
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  const completedCount = subtasks.filter((s) => s.completed).length;
  const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

  async function handleAdd() {
    if (!newTitle.trim()) return;
    
    setIsAdding(true);
    const formData = new FormData();
    formData.append("title", newTitle);
    formData.append("issueId", issueId);

    const result = await createSubtask(formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      setNewTitle("");
      router.refresh();
    }
    setIsAdding(false);
  }

  async function handleToggle(subtaskId: string, completed: boolean) {
    setLoadingId(subtaskId);
    const result = await updateSubtask(subtaskId, { completed: !completed });
    if (result?.error) {
      toast.error(result.error);
    } else {
      router.refresh();
    }
    setLoadingId(null);
  }

  async function handleDelete(subtaskId: string) {
    setLoadingId(subtaskId);
    const result = await deleteSubtask(subtaskId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      router.refresh();
    }
    setLoadingId(null);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            Subtasks
            {subtasks.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({completedCount}/{subtasks.length})
              </span>
            )}
          </CardTitle>
        </div>
        {subtasks.length > 0 && (
          <Progress value={progress} className="h-2 mt-2" />
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Subtask list */}
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group"
          >
            <Checkbox
              checked={subtask.completed}
              onCheckedChange={() => !isArchived && handleToggle(subtask.id, subtask.completed)}
              disabled={loadingId === subtask.id || isArchived}
            />
            <span
              className={`flex-1 text-sm ${
                subtask.completed ? "line-through text-muted-foreground" : ""
              }`}
            >
              {subtask.title}
            </span>
            {!isArchived && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(subtask.id)}
                disabled={loadingId === subtask.id}
              >
                {loadingId === subtask.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        ))}

        {/* Add new subtask - only show if not archived */}
        {!isArchived && (
          <div className="flex items-center gap-2 pt-2">
            <Input
              placeholder="Add a subtask..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              disabled={isAdding}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={isAdding || !newTitle.trim()}
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}

        {!isArchived && subtasks.length >= 20 && (
          <p className="text-xs text-muted-foreground">
            Maximum 20 subtasks reached
          </p>
        )}
      </CardContent>
    </Card>
  );
}

