"use client";
import { useActionState } from "react";
import type { ActionState } from "@/lib/errors";
import { Button } from "./ui/button";

type ServerAction = (
  state: ActionState,
  formData: FormData,
) => Promise<ActionState>;

export function AdminActionButton({
  action,
  values,
  label,
  variant = "outline",
}: {
  action: ServerAction;
  values: Record<string, string>;
  label: string;
  variant?: "default" | "outline" | "ghost";
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction}>
      {Object.entries(values).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button type="submit" size="sm" variant={variant} disabled={pending}>
        {pending ? "Aguarde…" : label}
      </Button>
      {state.error && (
        <p role="alert" className="mt-1 text-xs text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="mt-1 text-xs text-primary">
          {state.success}
        </p>
      )}
    </form>
  );
}
