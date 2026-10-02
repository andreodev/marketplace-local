"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { reviewAccountListingAction } from "../actions/admin-listing-actions";

export function AccountReviewActions({
  id,
  updatedAt,
}: {
  id: string;
  updatedAt: string;
}) {
  const [state, action, pending] = useActionState(reviewAccountListingAction, {});
  return (
    <form action={action} className="space-y-3 rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Revisar anúncio de conta</h2>
      <p className="text-sm text-muted-foreground">
        Confira as regras oficiais da plataforma, a titularidade declarada e as fotos. Não aprove anúncios com credenciais ou transferência proibida.
      </p>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="updatedAt" value={updatedAt} />
      <label htmlFor="review-note" className="block text-sm font-medium">Motivo da rejeição</label>
      <textarea
        id="review-note"
        name="note"
        rows={3}
        maxLength={500}
        className="w-full rounded-lg border border-input bg-background p-3 text-sm"
        placeholder="Obrigatório ao rejeitar; será exibido ao vendedor."
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="decision" value="APPROVE" disabled={pending}>Aprovar</Button>
        <Button type="submit" name="decision" value="REJECT" variant="outline" disabled={pending}>Rejeitar</Button>
      </div>
      <div aria-live="polite" className="text-sm">
        {state.error && <p role="alert" className="text-red-700">{state.error}</p>}
        {state.success && <p className="text-primary">{state.success}</p>}
      </div>
    </form>
  );
}
