import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters").max(100),
  key: z.string().min(2, "Key must be at least 2 characters").max(10).regex(/^[A-Z0-9]+$/, "Key must be uppercase letters and numbers only"),
  description: z.string().max(1000).optional(),
  teamId: z.string().cuid(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters").max(100).optional(),
  description: z.string().max(1000).optional(),
});

export const createStatusSchema = z.object({
  name: z.string().min(1, "Status name is required").max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  order: z.number().int().min(0),
  isDefault: z.boolean().default(false),
  isClosed: z.boolean().default(false),
});

export const updateStatusOrderSchema = z.object({
  statuses: z.array(z.object({
    id: z.string().cuid(),
    order: z.number().int().min(0),
  })),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateStatusInput = z.infer<typeof createStatusSchema>;
export type UpdateStatusOrderInput = z.infer<typeof updateStatusOrderSchema>;

