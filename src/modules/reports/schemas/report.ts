import { z } from "zod";

export const reportSchema = z
  .object({
    listingId: z.cuid(),
    reason: z.enum([
      "SCAM",
      "PROHIBITED_PRODUCT",
      "DUPLICATE",
      "FALSE_INFORMATION",
      "INAPPROPRIATE_CONTENT",
      "OTHER",
    ]),
    details: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .transform((value) => value || null),
  })
  .strict();

export const reportReasonLabels = {
  SCAM: "Possível golpe",
  PROHIBITED_PRODUCT: "Produto proibido",
  DUPLICATE: "Anúncio duplicado",
  FALSE_INFORMATION: "Informações falsas",
  INAPPROPRIATE_CONTENT: "Conteúdo impróprio",
  OTHER: "Outro",
} as const;
