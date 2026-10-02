"use server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/services/session-service";
import { startConversation } from "./service";

export async function openConversationAction(formData: FormData) {
  const listingId = formData.get("listingId");
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?callbackUrl=${encodeURIComponent(`/anuncio/${String(formData.get("slug") || "")}`)}`);
  const conversation = await startConversation(listingId, user.id);
  redirect(`/mensagens/${conversation.id}`);
}
