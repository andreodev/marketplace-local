import { z } from "zod";

export const brazilianPhoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()+.-]/g, ""))
  .transform((value) =>
    value.length === 10 || value.length === 11 ? `55${value}` : value,
  )
  .pipe(
    z
      .string()
      .regex(
        /^55[1-9]{2}[2-9]\d{7,8}$/,
        "Informe um telefone brasileiro com DDD.",
      ),
  );

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(100),
  phone: z
    .union([z.literal(""), brazilianPhoneSchema])
    .transform((value) => value || null),
  whatsapp: brazilianPhoneSchema,
  image: z
    .union([z.literal(""), z.url({ protocol: /^https$/ }).max(2048)])
    .transform((value) => value || null),
});
