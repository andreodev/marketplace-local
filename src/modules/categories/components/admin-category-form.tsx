"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createCategoryAction,
  updateCategoryAction,
} from "../actions/admin-category-actions";

type Category = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  sortOrder: number;
};

export function CreateCategoryForm() {
  const [state, action, pending] = useActionState(createCategoryAction, {});
  return (
    <form
      action={action}
      className="grid gap-3 rounded-2xl border p-4 sm:grid-cols-[1fr_1fr_120px_auto]"
    >
      <Input name="name" required maxLength={80} placeholder="Nome" />
      <Input
        name="slug"
        required
        maxLength={100}
        placeholder="slug-da-categoria"
        pattern="[a-z0-9]+(-[a-z0-9]+)*"
      />
      <Input
        name="sortOrder"
        required
        type="number"
        min="0"
        max="10000"
        defaultValue="0"
        aria-label="Ordem"
      />
      <Button disabled={pending}>{pending ? "Criando…" : "Criar"}</Button>
      {state.error && (
        <p role="alert" className="sm:col-span-4 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="sm:col-span-4 text-sm text-primary">
          {state.success}
        </p>
      )}
    </form>
  );
}

export function UpdateCategoryForm({ category }: { category: Category }) {
  const [state, action, pending] = useActionState(updateCategoryAction, {});
  return (
    <form
      action={action}
      className="grid items-center gap-3 border-t py-4 sm:grid-cols-[1fr_1fr_100px_120px_auto]"
    >
      <input type="hidden" name="id" value={category.id} />
      <Input name="name" required maxLength={80} defaultValue={category.name} />
      <Input
        name="slug"
        required
        maxLength={100}
        defaultValue={category.slug}
        pattern="[a-z0-9]+(-[a-z0-9]+)*"
      />
      <Input
        name="sortOrder"
        required
        type="number"
        min="0"
        max="10000"
        defaultValue={category.sortOrder}
        aria-label="Ordem"
      />
      <input type="hidden" name="active" value="false" />
      <label className="flex gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          value="true"
          defaultChecked={category.active}
        />
        Ativa
      </label>
      <Button disabled={pending} size="sm" variant="outline">
        {pending ? "Salvando…" : "Salvar"}
      </Button>
      {state.error && (
        <p role="alert" className="sm:col-span-5 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="sm:col-span-5 text-sm text-primary">
          {state.success}
        </p>
      )}
    </form>
  );
}
