import { requireUser } from "@/modules/auth/services/session-service";
import { ConversationList } from "@/modules/chat/components/conversation-list";

export const metadata = { title: "Mensagens" };
export default async function MessagesPage() {
  const user = await requireUser();
  return <main className="mx-auto max-w-5xl"><h1 className="mb-2 text-3xl font-semibold">Mensagens</h1><p className="mb-6 text-sm text-muted-foreground">Converse sem compartilhar seu número de telefone.</p><ConversationList userId={user.id} /></main>;
}
