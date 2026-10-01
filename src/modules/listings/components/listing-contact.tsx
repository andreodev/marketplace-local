"use client";
import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  contactSellerAction,
  recordViewAction,
} from "../actions/listing-actions";
export function ListingContact({ id }: { id: string }) {
  const [state, action, pending] = useActionState(contactSellerAction, {});
  useEffect(() => {
    void recordViewAction(id).catch(() => {});
  }, [id]);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <Button className="w-full" disabled={pending}>
        {pending ? "Abrindo WhatsApp…" : "Falar com vendedor"}
      </Button>
      {state.error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
