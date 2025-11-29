import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function generateProjectKey(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 4);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return formatDate(date);
  } else if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return "Just now";
  }
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "URGENT":
      return "text-red-500 bg-red-500/10";
    case "HIGH":
      return "text-orange-500 bg-orange-500/10";
    case "MEDIUM":
      return "text-yellow-500 bg-yellow-500/10";
    case "LOW":
      return "text-green-500 bg-green-500/10";
    default:
      return "text-gray-500 bg-gray-500/10";
  }
}

export function getTypeIcon(type: string): string {
  switch (type) {
    case "BUG":
      return "🐛";
    case "FEATURE":
      return "✨";
    case "TASK":
      return "📋";
    case "STORY":
      return "📖";
    case "EPIC":
      return "⚡";
    default:
      return "📋";
  }
}

