import { z } from "zod";
import { brazilianPhoneSchema } from "@/modules/users/schemas/profile";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Informe um email válido.").max(254)),
  password: z.string().min(1, "Informe sua senha.").max(128),
});

export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, "Informe seu nome.").max(100),
  whatsapp: z.union([z.literal(""), brazilianPhoneSchema]).transform((value) => value || null),
  password: z
    .string()
    .min(10, "Use uma senha com pelo menos 10 caracteres.")
    .max(128),
});
