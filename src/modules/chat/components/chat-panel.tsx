"use client";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CHAT_EVENT } from "./realtime-chat";

type Message = { id: string; body: string; senderId: string; createdAt: string };

export function ChatPanel({ conversationId, userId, otherName, listingTitle, listingSlug, initialMessages }: {
  conversationId: string; userId: string; otherName: string; listingTitle: string; listingSlug: string; initialMessages: Message[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const refresh = useCallback(async () => {
    const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, { cache: "no-store" });
    if (response.ok) {
      const data = await response.json() as { messages: Message[] };
      setMessages(data.messages);
    }
  }, [conversationId, router]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages]);
  useEffect(() => {
    const onMessage = () => { void refresh(); };
    window.addEventListener(CHAT_EVENT, onMessage);
    return () => window.removeEventListener(CHAT_EVENT, onMessage);
  }, [refresh]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }),
      });
      const result = await response.json() as { message?: Message; error?: string };
      if (!response.ok || !result.message) throw new Error(result.error || "Não foi possível enviar.");
      setMessages((current) => current.some((message) => message.id === result.message!.id) ? current : [...current, result.message!]);
      setBody("");
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível enviar."); }
    finally { setSending(false); }
  }

  return <Card className="gap-0 overflow-hidden p-0">
    <div className="border-b p-4 sm:p-5"><h1 className="text-lg font-semibold">{otherName}</h1><Link href={`/anuncio/${listingSlug}`} className="text-sm text-primary hover:underline">{listingTitle}</Link></div>
    <div role="log" aria-label="Mensagens da conversa" className="flex h-[52vh] min-h-80 flex-col gap-3 overflow-y-auto p-4 sm:p-6">
      {messages.length === 0 && <p className="m-auto max-w-xs text-center text-sm text-muted-foreground">Comece a conversa. Seu telefone não será mostrado à outra pessoa.</p>}
      {messages.map((message) => <div key={message.id} className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm", message.senderId === userId ? "ml-auto rounded-br-sm bg-primary text-primary-foreground" : "mr-auto rounded-bl-sm bg-muted text-foreground")}>
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <time className="mt-1 block text-right text-[11px] opacity-70" dateTime={message.createdAt}>{new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.createdAt))}</time>
      </div>)}
      <div ref={bottom} />
    </div>
    <form onSubmit={submit} className="border-t p-4"><label htmlFor="chat-message" className="sr-only">Sua mensagem</label><div className="flex items-end gap-2"><Textarea id="chat-message" value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} placeholder="Escreva sua mensagem..." className="min-h-11 resize-none" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} /><Button type="submit" disabled={sending || !body.trim()} aria-label="Enviar mensagem"><Send size={17} /></Button></div>{error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}<p className="mt-2 text-xs text-muted-foreground">Enter envia · Shift + Enter quebra a linha</p></form>
  </Card>;
}
