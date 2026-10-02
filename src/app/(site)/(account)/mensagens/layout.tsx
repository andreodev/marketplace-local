import { RealtimeChat } from "@/modules/chat/components/realtime-chat";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return <RealtimeChat>{children}</RealtimeChat>;
}
