"use client";
import { Flag } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createReportAction } from "../actions/report-actions";
import { reportReasonLabels } from "../schemas/report";

export function ReportListingForm({ listingId }: { listingId: string }) {
  const [state, action, pending] = useActionState(createReportAction, {});
  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
        Denunciar anúncio
      </summary>
      <form action={action} className="mt-3 space-y-3 rounded-xl border p-4">
        <input type="hidden" name="listingId" value={listingId} />
        <fieldset>
          <legend className="mb-2 text-sm font-medium">
            Motivo da denúncia
          </legend>
          {Object.entries(reportReasonLabels).map(([value, label]) => (
            <label key={value} className="mb-2 flex items-center gap-2 text-sm">
              <input type="radio" name="reason" value={value} required />
              {label}
            </label>
          ))}
        </fieldset>
        <textarea
          name="details"
          maxLength={2000}
          rows={3}
          className="w-full rounded-xl border border-input p-3 text-sm focus-visible:outline-2 focus-visible:outline-primary"
          placeholder="Conte mais detalhes, se necessário."
        />
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          <Flag size={16} />
          {pending ? "Enviando…" : "Enviar denúncia"}
        </Button>
        {state.error && (
          <p role="alert" className="text-sm text-red-700">
            {state.error}
          </p>
        )}
        {state.success && (
          <p role="status" className="text-sm text-primary">
            {state.success}
          </p>
        )}
      </form>
    </details>
  );
}
