import { z } from "zod";
import { mediaKeyPattern, MAX_LISTING_IMAGES } from "../utils/media-policy";
import { accountTypes } from "../utils/account-policy";

export const states = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

// Keep money as a string until Prisma.Decimal: never pass through a JS float.
export const priceSchema = z
  .string()
  .trim()
  .regex(
    /^(0|[1-9]\d{0,9})([.,]\d{1,2})?$/,
    "Informe um preço válido, sem separador de milhares.",
  )
  .transform((value) => value.replace(",", "."));

export const listingSchema = z
  .object({
    title: z.string().trim().min(5, "Use pelo menos 5 caracteres.").max(120),
    description: z
      .string()
      .trim()
      .min(20, "Descreva o produto com pelo menos 20 caracteres.")
      .max(10000),
    price: priceSchema,
    categoryId: z.cuid(),
    condition: z.enum(["NEW", "USED"]),
    city: z.string().trim().min(2).max(100),
    state: z.enum(states),
    neighborhood: z.string().trim().min(2).max(100),
    accountPlatform: z.string().trim().max(80).default(""),
    accountType: z.union([z.enum(accountTypes), z.literal("")]).default(""),
    accountPolicyUrl: z.string().trim().max(500).default(""),
    accountTransferConfirmed: z.boolean().default(false),
    images: z
      .array(z.string().regex(mediaKeyPattern, "Foto inválida."))
      .max(MAX_LISTING_IMAGES)
      .refine(
        (keys) => new Set(keys).size === keys.length,
        "Não repita fotos.",
      ),
  })
  .strict();

export type ListingInput = z.input<typeof listingSchema>;

export const saveListingSchema = listingSchema.extend({
  id: z.cuid().optional(),
  updatedAt: z.iso.datetime().optional(),
  intent: z.enum(["DRAFT", "ACTIVE", "SAVE"]),
});
export const changeStatusSchema = z
  .object({
    id: z.cuid(),
    updatedAt: z.iso.datetime(),
    status: z.enum(["ACTIVE", "PAUSED", "SOLD", "REMOVED"]),
  })
  .strict();
