"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { changeStatusAction } from "../actions/listing-actions";
import type { ListingStatus } from "@/generated/prisma/enums";
export function ListingStatusActions({
  listing,
}: {
  listing: { id: string; status: ListingStatus; updatedAt: string };
}) {
  const [state, action, pending] = useActionState(changeStatusAction, {});
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        {["DRAFT", "PENDING_REVIEW", "ACTIVE", "PAUSED"].includes(listing.status) && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/meus-anuncios/${listing.id}/editar`}>Editar</Link>
          </Button>
        )}
        <form
          action={action}
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            const submitter = (event.nativeEvent as SubmitEvent)
              .submitter as HTMLButtonElement | null;
            if (
              submitter?.value === "REMOVED" &&
              !window.confirm(
                "Excluir este anúncio? Ele deixará de aparecer no marketplace.",
              )
            )
              event.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={listing.id} />
          <input type="hidden" name="updatedAt" value={listing.updatedAt} />
          {listing.status === "DRAFT" && (
            <Button size="sm" name="status" value="ACTIVE" disabled={pending}>
              Publicar
            </Button>
          )}
          {listing.status === "ACTIVE" && (
            <Button
              size="sm"
              variant="outline"
              name="status"
              value="PAUSED"
              disabled={pending}
            >
              Pausar
            </Button>
          )}
          {listing.status === "PAUSED" && (
            <Button size="sm" name="status" value="ACTIVE" disabled={pending}>
              Reativar
            </Button>
          )}
          {["ACTIVE", "PAUSED"].includes(listing.status) && (
            <Button
              size="sm"
              variant="outline"
              name="status"
              value="SOLD"
              disabled={pending}
            >
              Marcar como vendido
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            name="status"
            value="REMOVED"
            disabled={pending}
          >
            Excluir
          </Button>
        </form>
      </div>
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
    </div>
  );
}
