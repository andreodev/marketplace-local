"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AppError, type ActionState } from "@/lib/errors";
import { signIn, signOut } from "../config";
import { registerUser } from "../services/auth-service";
import { loginSchema } from "../schemas/auth";

export async function loginAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: "/meus-anuncios",
    });
  } catch (error) {
    if (error instanceof AuthError)
      return {
        error:
          "Não foi possível entrar. Confira seus dados ou tente novamente mais tarde.",
      };
    throw error; // Includes the successful Next.js redirect.
  }
  return {};
}

export async function registerAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await registerUser(Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0].message };
    if (error instanceof AppError) return { error: error.message };
    console.error(
      "Registration failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return {
      error: "Não foi possível criar sua conta. Tente novamente mais tarde.",
    };
  }
  redirect("/entrar?cadastro=sucesso");
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
