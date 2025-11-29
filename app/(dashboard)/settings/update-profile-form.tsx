"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateProfile } from "./actions";
import type { User } from "@prisma/client";

interface UpdateProfileFormProps {
  user: User;
}

export function UpdateProfileForm({ user }: UpdateProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    const result = await updateProfile(formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Profile updated successfully");
    }
    setIsLoading(false);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={user.name || ""}
          disabled={isLoading}
        />
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Save Changes
      </Button>
    </form>
  );
}

