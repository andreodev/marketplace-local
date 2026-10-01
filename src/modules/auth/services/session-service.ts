import "server-only";
import { cache } from "react";
import { redirect, notFound } from "next/navigation";
import { auth } from "../config";
import { userRepository } from "@/modules/users/repositories/user-repository";

// Request-scoped only: suspended users and role changes are checked in the DB.
export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await userRepository.findById(session.user.id);
  return user?.status === "ACTIVE" ? user : null;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") notFound();
  return user;
}
