"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { startPromotion } from "../services/promotion-service";

export async function startPromotionAction(formData: FormData) {
  let orderId: string;
  try {
    const listingId = z.cuid().parse(formData.get("listingId"));
    orderId = await startPromotion(listingId, String(formData.get("cpf") ?? ""));
  } catch (error) {
    console.error("Promotion checkout failed", error instanceof Error ? error.name : "UnknownError");
    redirect("/meus-anuncios?destaque=erro");
  }
  redirect(`/meus-anuncios/destaque/${orderId}`);
}
