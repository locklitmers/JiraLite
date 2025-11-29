"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toggleFavorite } from "../actions";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FavoriteButtonProps {
  projectId: string;
  isFavorite: boolean;
}

export function FavoriteButton({ projectId, isFavorite }: FavoriteButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [favorite, setFavorite] = useState(isFavorite);
  const router = useRouter();

  async function handleToggle() {
    setIsLoading(true);
    const result = await toggleFavorite(projectId);
    if (result?.error) {
      toast.error(result.error);
    } else if (result?.isFavorite !== undefined) {
      setFavorite(result.isFavorite);
      toast.success(result.isFavorite ? "Added to favorites" : "Removed from favorites");
      router.refresh();
    }
    setIsLoading(false);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={handleToggle}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Star
          className={`w-4 h-4 ${
            favorite ? "fill-yellow-400 text-yellow-400" : ""
          }`}
        />
      )}
    </Button>
  );
}

