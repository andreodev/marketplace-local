import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";

const idSchema = z.cuid();
const bodySchema = z.string().trim().min(1, "Escreva uma mensagem.").max(2000, "A mensagem deve ter até 2.000 caracteres.");

export async function startConversation(listingId: unknown, buyerId: string) {
  const id = idSchema.parse(listingId);
  const listing = await db.listing.findFirst({
    where: { id, status: "ACTIVE", seller: { status: "ACTIVE" }, category: { active: true } },
    select: { sellerId: true },
  });
  if (!listing) throw new AppError("Este anúncio não está disponível.");
  if (listing.sellerId === buyerId) throw new AppError("Você não pode conversar sobre seu próprio anúncio.");
  return db.chatConversation.upsert({
    where: { listingId_buyerId: { listingId: id, buyerId } },
    update: {},
    create: { listingId: id, buyerId, sellerId: listing.sellerId },
    select: { id: true },
  });
}

export async function listConversations(userId: string) {
  return db.chatConversation.findMany({
    where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
    orderBy: { updatedAt: "desc" },
    include: {
      listing: { select: { title: true, slug: true, images: { orderBy: { position: "asc" }, take: 1, select: { url: true } } } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, senderId: true, createdAt: true } },
    },
  });
}

export async function getConversation(id: unknown, userId: string) {
  const conversationId = idSchema.parse(id);
  return db.chatConversation.findFirst({
    where: { id: conversationId, OR: [{ buyerId: userId }, { sellerId: userId }] },
    include: {
      listing: { select: { title: true, slug: true, images: { orderBy: { position: "asc" }, take: 1, select: { url: true } } } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      messages: { orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: 100, select: { id: true, body: true, senderId: true, createdAt: true } },
    },
  });
}

export async function markRead(id: string, userId: string) {
  const conversation = await db.chatConversation.findFirst({ where: { id, OR: [{ buyerId: userId }, { sellerId: userId }] }, select: { buyerId: true } });
  if (!conversation) throw new AppError("Conversa não encontrada.");
  await db.chatConversation.update({ where: { id }, data: conversation.buyerId === userId ? { buyerReadAt: new Date() } : { sellerReadAt: new Date() } });
}

export async function sendMessage(id: unknown, userId: string, input: unknown) {
  const conversationId = idSchema.parse(id);
  const body = bodySchema.parse(input);
  const conversation = await db.chatConversation.findFirst({
    where: { id: conversationId, OR: [{ buyerId: userId }, { sellerId: userId }] },
    select: { buyerId: true, sellerId: true },
  });
  if (!conversation) throw new AppError("Conversa não encontrada.");
  const message = await db.$transaction(async (tx) => {
    const created = await tx.chatMessage.create({ data: { conversationId, senderId: userId, body }, select: { id: true, body: true, senderId: true, createdAt: true } });
    await tx.chatConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date(), ...(conversation.buyerId === userId ? { buyerReadAt: new Date() } : { sellerReadAt: new Date() }) } });
    return created;
  });
  try {
    await db.$queryRaw`SELECT pg_notify('chat_events', ${JSON.stringify({ users: [conversation.buyerId, conversation.sellerId], conversationId })})::text`;
  } catch (error) {
    console.error("Chat notification failed", error);
  }
  return message;
}
