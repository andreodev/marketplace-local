import { z } from "zod";

export const accountReviewSchema = z.object({
  id: z.cuid(),
  updatedAt: z.iso.datetime(),
  decision: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().max(500),
}).strict();
