import { getCurrentUser } from "@/modules/auth/services/session-service";
import { getConversation, markRead, sendMessage } from "@/modules/chat/service";
import { AppError } from "@/lib/errors";
import { z } from "zod";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta." }, { status: 401 });
  const { id } = await params;
  const conversation = await getConversation(id, user.id).catch(() => null);
  if (!conversation) return Response.json({ error: "Conversa não encontrada." }, { status: 404 });
  await markRead(conversation.id, user.id);
  return Response.json({ messages: conversation.messages }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta." }, { status: 401 });
  try {
    const { id } = await params;
    const input = await request.json();
    const message = await sendMessage(id, user.id, input.body);
    return Response.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: error.issues[0].message }, { status: 400 });
    if (error instanceof AppError) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ error: "Não foi possível enviar a mensagem." }, { status: 500 });
  }
}
