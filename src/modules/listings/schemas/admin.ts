import { z } from "zod";

export const removeListingAsAdminSchema = z.object({ id: z.cuid() }).strict();
