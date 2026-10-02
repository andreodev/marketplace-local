"use client";
import { useActionState } from "react";
import type { ActionState } from "@/lib/errors";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
export type FormField = {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  defaultValue?: string;
};
export function ActionForm({
  action,
  fields,
  submitLabel,
  hiddenFields,
}: {
  action: (state: ActionState, data: FormData) => Promise<ActionState>;
  fields: FormField[];
  submitLabel: string;
  hiddenFields?: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-5">
      {Object.entries(hiddenFields ?? {}).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      {fields.map(({ label, ...field }) => (
        <div key={field.name}>
          <label
            htmlFor={field.name}
            className="mb-2 block text-sm font-medium"
          >
            {label}
          </label>
          <Input id={field.name} {...field} />
        </div>
      ))}
      <div aria-live="polite">
        {state.error && (
          <p role="alert" className="text-sm text-red-700">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="text-sm text-primary">{state.success}</p>
        )}
      </div>
      <Button disabled={pending} className="w-full">
        {pending ? "Aguarde…" : submitLabel}
      </Button>
    </form>
  );
}
