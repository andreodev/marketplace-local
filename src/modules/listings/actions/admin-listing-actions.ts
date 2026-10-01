"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AppError, type ActionState } from "@/lib/errors";
import { removeListingAsAdmin } from "../services/admin-listing-service";

export async function removeListingAsAdminAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await removeListingAsAdmin(Object.fromEntries(formData));
    revalidatePath("/");
    revalidatePath("/buscar");
    revalidatePath("/admin");
    revalidatePath("/admin/anuncios");
    return { success: "Anúncio removido." };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: "Anúncio inválido." };
    if (error instanceof AppError) return { error: error.message };
    if (error instanceof Error && "digest" in error) throw error;
    console.error(
      "Listing moderation failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return { error: "Não foi possível remover o anúncio." };
  }
}
