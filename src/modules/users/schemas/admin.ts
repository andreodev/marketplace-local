import { z } from "zod";

export const userModerationSchema = z
  .object({
    id: z.cuid(),
    status: z.enum(["ACTIVE", "SUSPENDED"]),
  })
  .strict();
