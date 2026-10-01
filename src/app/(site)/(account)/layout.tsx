import { requireUser } from "@/modules/auth/services/session-service";
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  return children;
}
