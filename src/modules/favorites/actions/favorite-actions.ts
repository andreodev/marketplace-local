"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AppError, type ActionState } from "@/lib/errors";
import { toggleFavorite } from "../services/favorite-service";

export async function toggleFavoriteAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const active = await toggleFavorite(formData.get("listingId"));
    revalidatePath("/favoritos");
    revalidatePath("/anuncio/[slug]", "page");
    return {
      success: active ? "Adicionado aos favoritos." : "Removido dos favoritos.",
    };
  } catch (error) {
    if (error instanceof z.ZodError) return { error: "Anúncio inválido." };
    if (error instanceof AppError) return { error: error.message };
    if (error instanceof Error && "digest" in error) throw error;
    console.error(
      "Favorite operation failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return { error: "Não foi possível alterar os favoritos." };
  }
}
