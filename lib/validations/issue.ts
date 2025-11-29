import { z } from "zod";

export const createIssueSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  type: z.enum(["BUG", "FEATURE", "TASK", "STORY", "EPIC"]).default("TASK"),
  statusId: z.string().cuid(),
  assigneeId: z.string().min(1).optional().nullable(), // Can be UUID or CUID
  dueDate: z.string().datetime().optional().nullable(),
  projectId: z.string().cuid(),
});

export const updateIssueSchema = z.object({
  title: z.string().min(1, "Title is required").max(200).optional(),
  description: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  type: z.enum(["BUG", "FEATURE", "TASK", "STORY", "EPIC"]).optional(),
  statusId: z.string().cuid().optional(),
  assigneeId: z.string().min(1).optional().nullable(), // Can be UUID or CUID
  dueDate: z.string().datetime().optional().nullable(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(10000),
  issueId: z.string().cuid(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(10000),
});

export const moveIssueSchema = z.object({
  issueId: z.string().cuid(),
  statusId: z.string().cuid(),
  order: z.number().int().min(0).optional(),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type MoveIssueInput = z.infer<typeof moveIssueSchema>;

