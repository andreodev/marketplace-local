import { z } from "zod";

export const reportModerationSchema = z
  .object({
    id: z.cuid(),
    status: z.enum(["REVIEWING", "RESOLVED", "DISMISSED"]),
  })
  .strict();
