"use client";
import { Heart } from "lucide-react";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toggleFavoriteAction } from "../actions/favorite-actions";

export function FavoriteButton({
  listingId,
  active,
}: {
  listingId: string;
  active: boolean;
}) {
  const [state, action, pending] = useActionState(toggleFavoriteAction, {});
  const router = useRouter();
  useEffect(() => {
    if (state.success) router.refresh();
  }, [router, state.success]);
  return (
    <form action={action}>
      <input type="hidden" name="listingId" value={listingId} />
      <Button
        type="submit"
        variant="outline"
        className="w-full"
        disabled={pending}
        aria-pressed={active}
      >
        <Heart size={18} fill={active ? "currentColor" : "none"} />
        {pending ? "Aguarde…" : active ? "Remover dos favoritos" : "Favoritar"}
      </Button>
      {state.error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="mt-2 text-sm text-primary">
          {state.success}
        </p>
      )}
    </form>
  );
}
