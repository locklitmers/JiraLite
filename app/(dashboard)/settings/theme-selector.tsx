"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="space-y-2">
      <Label>Theme</Label>
      <div className="flex gap-2">
        {themes.map((t) => (
          <Button
            key={t.value}
            variant={theme === t.value ? "default" : "outline"}
            className={cn("flex-1 gap-2")}
            onClick={() => setTheme(t.value)}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

