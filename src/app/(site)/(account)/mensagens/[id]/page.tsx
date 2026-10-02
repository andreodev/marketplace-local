import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/modules/auth/services/session-service";
import { ConversationList } from "@/modules/chat/components/conversation-list";
import { ChatPanel } from "@/modules/chat/components/chat-panel";
import { getConversation, markRead } from "@/modules/chat/service";

export const metadata = { title: "Conversa" };
export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const conversation = await getConversation(id, user.id).catch(() => null);
  if (!conversation) notFound();
  await markRead(conversation.id, user.id);
  const other = conversation.buyerId === user.id ? conversation.seller : conversation.buyer;
  return <main className="mx-auto max-w-6xl">
    <Link href="/mensagens" className="mb-5 inline-block text-sm text-primary hover:underline">← Todas as mensagens</Link>
    <div className="grid gap-5 md:grid-cols-[18rem_minmax(0,1fr)]">
      <div className="hidden md:block"><ConversationList userId={user.id} selectedId={id} /></div>
      <ChatPanel conversationId={id} userId={user.id} otherName={other.name} listingTitle={conversation.listing.title} listingSlug={conversation.listing.slug} initialMessages={conversation.messages.map((message) => ({ ...message, createdAt: message.createdAt.toISOString() }))} />
    </div>
  </main>;
}
