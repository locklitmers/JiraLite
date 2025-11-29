"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { archiveProject } from "../../actions";
import { Archive, ArchiveRestore, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ArchiveProjectButtonProps {
  projectId: string;
  archived: boolean;
}

export function ArchiveProjectButton({ projectId, archived }: ArchiveProjectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleArchive() {
    setIsLoading(true);
    const result = await archiveProject(projectId);
    if (result?.error) {
      toast.error(result.error);
    } else if (result?.archived !== undefined) {
      toast.success(result.archived ? "Project archived" : "Project restored");
      router.refresh();
    }
    setIsLoading(false);
  }

  return (
    <Button
      variant={archived ? "default" : "destructive"}
      onClick={handleArchive}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : archived ? (
        <ArchiveRestore className="w-4 h-4 mr-2" />
      ) : (
        <Archive className="w-4 h-4 mr-2" />
      )}
      {archived ? "Restore" : "Archive"}
    </Button>
  );
}

