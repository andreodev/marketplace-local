import { z } from "zod";
import { states } from "./listing";

const stringParam = z.string().trim().max(100).optional().catch(undefined);

export const listingSearchSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  categoria: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional()
    .catch(undefined),
  cidade: stringParam,
  estado: z.enum(states).optional().catch(undefined),
  condicao: z.enum(["NEW", "USED"]).optional().catch(undefined),
  pagina: z.coerce.number().int().min(1).max(10_000).catch(1).default(1),
});

export type ListingSearch = z.output<typeof listingSearchSchema>;

export function parseListingSearch(
  searchParams: Record<string, string | string[] | undefined>,
) {
  return listingSearchSchema.parse(
    Object.fromEntries(
      Object.entries(searchParams).map(([key, value]) => [
        key,
        Array.isArray(value) ? value[0] : value,
      ]),
    ),
  );
}
