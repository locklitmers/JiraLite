"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { addLabelToIssue, removeLabelFromIssue } from "../../labels/actions";
import { Plus, X, Tag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Label, IssueLabel } from "@prisma/client";

interface IssueLabelSelectorProps {
  issueId: string;
  currentLabels: (IssueLabel & { label: Label })[];
  projectLabels: Label[];
  isArchived?: boolean;
}

export function IssueLabelSelector({
  issueId,
  currentLabels,
  projectLabels,
  isArchived = false,
}: IssueLabelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  const currentLabelIds = currentLabels.map((l) => l.labelId);
  const availableLabels = projectLabels.filter((l) => !currentLabelIds.includes(l.id));

  async function handleAdd(labelId: string) {
    setLoadingId(labelId);
    const result = await addLabelToIssue(issueId, labelId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      router.refresh();
    }
    setLoadingId(null);
  }

  async function handleRemove(labelId: string) {
    setLoadingId(labelId);
    const result = await removeLabelFromIssue(issueId, labelId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      router.refresh();
    }
    setLoadingId(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Labels
        </span>
        {projectLabels.length > 0 && currentLabels.length < 5 && !isArchived && (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end">
              {availableLabels.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No more labels available
                </p>
              ) : (
                <div className="space-y-1">
                  {availableLabels.map((label) => (
                    <button
                      key={label.id}
                      className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted text-left"
                      onClick={() => handleAdd(label.id)}
                      disabled={loadingId === label.id}
                    >
                      {loadingId === label.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                      )}
                      <span className="text-sm">{label.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>
        )}
      </div>

      {currentLabels.length === 0 ? (
        <p className="text-sm text-muted-foreground">No labels</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {currentLabels.map((il) => (
            <Badge
              key={il.id}
              style={{ backgroundColor: il.label.color, color: "white" }}
              className={isArchived ? "" : "gap-1 pr-1"}
            >
              {il.label.name}
              {!isArchived && (
                <button
                  onClick={() => handleRemove(il.labelId)}
                  disabled={loadingId === il.labelId}
                  className="hover:bg-white/20 rounded-full p-0.5"
                >
                  {loadingId === il.labelId ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {!isArchived && currentLabels.length >= 5 && (
        <p className="text-xs text-muted-foreground">Maximum 5 labels</p>
      )}
    </div>
  );
}

