import { z } from "zod";

const fields = {
  name: z.string().trim().min(2, "Informe o nome da categoria.").max(80),
  slug: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use letras minúsculas, números e hífens no slug.",
    )
    .max(100),
  sortOrder: z.coerce.number().int().min(0).max(10_000),
};

export const createCategorySchema = z.object(fields).strict();
export const updateCategorySchema = z
  .object({
    id: z.cuid(),
    ...fields,
    active: z.enum(["true", "false"]).transform((value) => value === "true"),
  })
  .strict();
