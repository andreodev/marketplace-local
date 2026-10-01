"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AppError, type ActionState } from "@/lib/errors";
import { updateProfile } from "../services/profile-service";

export async function updateProfileAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await updateProfile(Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof z.ZodError) return { error: error.issues[0].message };
    if (error instanceof AppError) return { error: error.message };
    console.error(
      "Profile update failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return { error: "Não foi possível salvar seu perfil. Tente novamente." };
  }
  revalidatePath("/", "layout");
  return { success: "Perfil atualizado." };
}
