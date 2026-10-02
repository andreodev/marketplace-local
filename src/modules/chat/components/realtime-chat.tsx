"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const CHAT_EVENT = "perto:chat-message";

export function RealtimeChat({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    let active = true;
    let socket: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let fallback: ReturnType<typeof setInterval> | undefined;
    const refresh = () => {
      router.refresh();
      window.dispatchEvent(new Event(CHAT_EVENT));
    };
    async function connect() {
      try {
        const response = await fetch("/api/chat/ticket", { cache: "no-store" });
        if (!response.ok || !active) return;
        const { ticket } = await response.json() as { ticket: string };
        if (!active) return;
        const url = new URL("/chat/socket", window.location.href);
        url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
        url.searchParams.set("ticket", ticket);
        socket = new WebSocket(url);
        socket.onopen = () => { clearInterval(fallback); fallback = undefined; window.dispatchEvent(new Event(CHAT_EVENT)); };
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as { type?: string };
            if (data.type === "message") refresh();
          } catch { /* Ignore malformed notification. */ }
        };
        socket.onclose = () => {
          if (!active) return;
          // Keeps conversations usable if a deployment does not forward upgrades.
          fallback ??= setInterval(refresh, 5000);
          retry = setTimeout(connect, 3000);
        };
      } catch {
        if (active) retry = setTimeout(connect, 5000);
      }
    }
    void connect();
    return () => { active = false; clearTimeout(retry); clearInterval(fallback); socket?.close(); };
  }, [router]);
  return children;
}
