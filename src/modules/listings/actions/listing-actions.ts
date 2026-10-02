"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AppError, type ActionState } from "@/lib/errors";
import {
  saveListing,
  changeListingStatus,
  trackListingView,
} from "../services/listing-service";
import { uploadListingPhoto } from "../services/media-service";
import { mediaUrl } from "../utils/media-policy";

function failure(error: unknown): ActionState {
  if (error instanceof z.ZodError) return { error: error.issues[0].message };
  if (error instanceof AppError) return { error: error.message };
  // Preserve framework redirects (including an expired session).
  if (error instanceof Error && "digest" in error) throw error;
  console.error(
    "Listing operation failed",
    error instanceof Error ? error.name : "UnknownError",
  );
  return { error: "Não foi possível concluir. Tente novamente." };
}
function refreshListings() {
  revalidatePath("/");
  revalidatePath("/buscar");
  revalidatePath("/categoria/[slug]", "page");
  revalidatePath("/meus-anuncios");
  revalidatePath("/anuncio/[slug]", "page");
}
export async function saveListingAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const fields = [
      "title",
      "description",
      "price",
      "categoryId",
      "condition",
      "city",
      "state",
      "neighborhood",
      "accountPlatform",
      "accountType",
      "accountPolicyUrl",
      "intent",
    ];
    const input = Object.fromEntries(
      fields.map((field) => [field, formData.get(field) ?? ""]),
    );
    const saved = await saveListing({
      ...input,
      accountTransferConfirmed: formData.get("accountTransferConfirmed") === "on",
      images: formData.getAll("images"),
      ...(formData.get("id")
        ? { id: formData.get("id"), updatedAt: formData.get("updatedAt") }
        : {}),
    });
    refreshListings();
    redirect(saved.status === "PENDING_REVIEW" ? "/meus-anuncios?sucesso=analise" : "/meus-anuncios?sucesso=salvo");
  } catch (error) {
    return failure(error);
  }
}
export async function changeStatusAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const status = await changeListingStatus({
      id: formData.get("id"),
      updatedAt: formData.get("updatedAt"),
      status: formData.get("status"),
    });
    refreshListings();
    return { success: status === "PENDING_REVIEW" ? "Anúncio enviado para análise." : "Status atualizado." };
  } catch (error) {
    return failure(error);
  }
}
export async function uploadPhotoAction(
  formData: FormData,
): Promise<{ key?: string; url?: string; error?: string }> {
  try {
    const file = formData.get("photo");
    if (!(file instanceof File)) throw new AppError("Selecione uma foto.");
    const key = await uploadListingPhoto(file);
    return { key, url: mediaUrl(key) };
  } catch (error) {
    return failure(error);
  }
}
export async function recordViewAction(id: string) {
  const parsed = z.cuid().safeParse(id);
  if (!parsed.success) return;
  const jar = await cookies();
  const key = `view-${id}`;
  if (jar.has(key)) return;
  await trackListingView(id);
  jar.set(key, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 86400,
    path: `/anuncio`,
  });
}
