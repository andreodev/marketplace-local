"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AppError, type ActionState } from "@/lib/errors";
import { setUserStatusAsAdmin } from "../services/admin-user-service";

export async function setUserStatusAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await setUserStatusAsAdmin(Object.fromEntries(formData));
    revalidatePath("/admin");
    revalidatePath("/admin/usuarios");
    return { success: "Status do usuário atualizado." };
  } catch (error) {
    if (error instanceof z.ZodError)
      return { error: "Usuário ou status inválido." };
    if (error instanceof AppError) return { error: error.message };
    if (error instanceof Error && "digest" in error) throw error;
    console.error(
      "User moderation failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return { error: "Não foi possível atualizar o usuário." };
  }
}
