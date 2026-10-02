import { getCurrentUser } from "@/modules/auth/services/session-service";
import { createChatTicket } from "@/modules/chat/ticket";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Entre na sua conta." }, { status: 401 });
  return Response.json({ ticket: createChatTicket(user.id) }, { headers: { "Cache-Control": "no-store" } });
}
