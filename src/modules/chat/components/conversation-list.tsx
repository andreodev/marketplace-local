import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { listConversations } from "../service";

export async function ConversationList({ userId, selectedId }: { userId: string; selectedId?: string }) {
  const conversations = await listConversations(userId);
  if (!conversations.length) return <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground"><MessageCircle className="mx-auto mb-3" />Ainda não há conversas. Abra um anúncio e envie uma mensagem ao vendedor.</div>;
  return <nav aria-label="Conversas" className="divide-y overflow-hidden rounded-xl border bg-card">
    {conversations.map((conversation) => {
      const other = conversation.buyerId === userId ? conversation.seller : conversation.buyer;
      const unread = conversation.messages[0] && conversation.messages[0].senderId !== userId && conversation.messages[0].createdAt > (conversation.buyerId === userId ? conversation.buyerReadAt : conversation.sellerReadAt);
      return <Link key={conversation.id} href={`/mensagens/${conversation.id}`} className={cn("flex gap-3 p-4 transition-colors hover:bg-accent", selectedId === conversation.id && "bg-accent")}>
        {conversation.listing.images[0] ? <img src={conversation.listing.images[0].url} alt="" className="h-14 w-14 rounded-lg object-cover" /> : <div className="h-14 w-14 rounded-lg bg-muted" />}
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2"><strong className="truncate text-sm">{other.name}</strong>{unread && <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-label="Mensagem não lida" />}</span>
          <span className="block truncate text-xs text-muted-foreground">{conversation.listing.title}</span>
          <span className={cn("mt-1 block truncate text-sm", unread ? "font-semibold" : "text-muted-foreground")}>{conversation.messages[0]?.body ?? "Conversa iniciada. Envie a primeira mensagem."}</span>
        </span>
      </Link>;
    })}
  </nav>;
}
