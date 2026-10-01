import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  requireUser,
  getCurrentUser,
} from "@/modules/auth/services/session-service";
import { AppError } from "@/lib/errors";
import { mediaExists } from "@/lib/media-storage";
import { listingRepository } from "../repositories/listing-repository";
import {
  saveListingSchema,
  changeStatusSchema,
  listingSchema,
} from "../schemas/listing";
import {
  assertListingOwner,
  assertStatusTransition,
} from "../utils/listing-policy";
import { assertMediaKey } from "../utils/media-policy";

export async function saveListing(input: unknown) {
  const user = await requireUser();
  const { id, updatedAt, intent, ...data } = saveListingSchema.parse(input);
  const existing = id ? await listingRepository.findOwned(id, user.id) : null;
  if (id && !existing) throw new AppError("Anúncio não encontrado.");
  if (existing) {
    assertListingOwner(existing, user.id);
    if (!["DRAFT", "ACTIVE", "PAUSED"].includes(existing.status))
      throw new AppError("Este anúncio não pode mais ser editado.");
    if (!updatedAt || existing.updatedAt.toISOString() !== updatedAt)
      throw new AppError("O anúncio foi alterado. Recarregue a página.");
    if (intent === "DRAFT" && existing.status !== "DRAFT")
      throw new AppError("Um anúncio publicado não pode voltar a rascunho.");
  } else if (intent === "SAVE")
    throw new AppError("Escolha salvar rascunho ou publicar.");
  const status = intent === "SAVE" ? existing!.status : intent;
  if (status === "ACTIVE" && data.images.length === 0)
    throw new AppError("Adicione pelo menos uma foto para publicar.");
  if (existing && existing.status !== status)
    assertStatusTransition(existing.status, status);
  for (const key of data.images) {
    assertMediaKey(key, user.id);
    if (!(await mediaExists(key)))
      throw new AppError("Uma foto não foi encontrada. Envie novamente.");
  }
  const slug =
    existing?.slug ??
    `${
      data.title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 100) || "produto"
    }-${randomUUID()}`;
  return listingRepository.save(
    user.id,
    data,
    status,
    slug,
    existing ? { id: existing.id, updatedAt: existing.updatedAt } : undefined,
  );
}
export async function changeListingStatus(input: unknown) {
  const user = await requireUser();
  const data = changeStatusSchema.parse(input);
  const listing = await listingRepository.findOwned(data.id, user.id);
  if (!listing) throw new AppError("Anúncio não encontrado.");
  assertListingOwner(listing, user.id);
  assertStatusTransition(listing.status, data.status);
  if (listing.updatedAt.toISOString() !== data.updatedAt)
    throw new AppError("O anúncio foi alterado. Recarregue a página.");
  if (data.status === "ACTIVE") {
    if (listing.images.length === 0)
      throw new AppError("Adicione pelo menos uma foto para publicar.");
    listingSchema.parse({
      title: listing.title,
      description: listing.description,
      price: listing.price.toFixed(2),
      categoryId: listing.categoryId,
      condition: listing.condition,
      city: listing.city,
      state: listing.state,
      neighborhood: listing.neighborhood,
      images: listing.images.map((image) => image.storageKey),
    });
    for (const image of listing.images) {
      if (!image.storageKey || !(await mediaExists(image.storageKey)))
        throw new AppError(
          "Uma foto não foi encontrada. Edite o anúncio e envie novamente.",
        );
    }
  }
  await listingRepository.changeStatus(
    listing.id,
    user.id,
    listing.status,
    data.status,
    listing.updatedAt,
  );
}
export async function contactSeller(id: unknown) {
  const listingId = z.cuid().parse(id);
  const user = await getCurrentUser();
  const listing = await listingRepository.recordContact(listingId, user?.id);
  const text = `Olá! Vi seu anúncio '${listing.title}' na plataforma e tenho interesse. Ainda está disponível?`;
  return `https://wa.me/${listing.seller.whatsapp}?text=${encodeURIComponent(text)}`;
}

export async function trackListingView(id: unknown) {
  const parsed = z.cuid().safeParse(id);
  if (parsed.success) await listingRepository.recordView(parsed.data);
}
