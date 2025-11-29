"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createLabel, updateLabel, deleteLabel } from "../labels/actions";
import { Plus, Pencil, Trash2, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import type { Label as LabelType } from "@prisma/client";

interface LabelManagerProps {
  projectId: string;
  labels: LabelType[];
}

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
];

export function LabelManager({ projectId, labels }: LabelManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingLabel, setEditingLabel] = useState<LabelType | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const router = useRouter();

  function openCreate() {
    setEditingLabel(null);
    setName("");
    setColor("#3b82f6");
    setIsOpen(true);
  }

  function openEdit(label: LabelType) {
    setEditingLabel(label);
    setName(label.name);
    setColor(label.color);
    setIsOpen(true);
  }

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsLoading(true);

    if (editingLabel) {
      const result = await updateLabel(editingLabel.id, { name, color });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Label updated");
        setIsOpen(false);
        router.refresh();
      }
    } else {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("color", color);
      formData.append("projectId", projectId);

      const result = await createLabel(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Label created");
        setIsOpen(false);
        router.refresh();
      }
    }

    setIsLoading(false);
  }

  async function handleDelete(labelId: string) {
    if (!confirm("Are you sure you want to delete this label?")) return;

    const result = await deleteLabel(labelId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Label deleted");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Labels
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage labels for this project ({labels.length}/20)
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate} disabled={labels.length >= 20}>
              <Plus className="w-4 h-4 mr-2" />
              Add Label
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingLabel ? "Edit Label" : "Create Label"}
              </DialogTitle>
              <DialogDescription>
                {editingLabel
                  ? "Update the label name and color"
                  : "Add a new label to categorize issues"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. bug, feature, urgent"
                  maxLength={30}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        color === c ? "border-foreground scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-8 p-0 border-0"
                  />
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Preview:</span>
                <Badge style={{ backgroundColor: color, color: "white" }}>
                  {name || "Label"}
                </Badge>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingLabel ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Labels list */}
      <div className="space-y-2">
        {labels.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No labels yet. Create one to categorize issues.
          </p>
        ) : (
          labels.map((label) => (
            <div
              key={label.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <Badge style={{ backgroundColor: label.color, color: "white" }}>
                {label.name}
              </Badge>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEdit(label)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleDelete(label.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

