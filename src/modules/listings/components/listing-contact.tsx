"use client";
import { useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recordViewAction } from "../actions/listing-actions";
import { openConversationAction } from "@/modules/chat/actions";

export function ListingContact({ id, slug, ownListing }: { id: string; slug: string; ownListing: boolean }) {
  useEffect(() => { void recordViewAction(id).catch(() => {}); }, [id]);
  if (ownListing) return <p className="text-sm text-muted-foreground">Este é o seu anúncio. As mensagens de compradores aparecem na sua caixa de entrada.</p>;
  return (
    <form action={openConversationAction}>
      <input type="hidden" name="listingId" value={id} />
      <input type="hidden" name="slug" value={slug} />
      <Button className="w-full"><MessageCircle size={17} aria-hidden="true" /> Conversar pelo chat</Button>
    </form>
  );
}
