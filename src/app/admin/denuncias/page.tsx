import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AdminActionButton } from "@/components/admin-action-button";
import { updateReportStatusAction } from "@/modules/reports/actions/admin-report-actions";
import { reportReasonLabels } from "@/modules/reports/schemas/report";
import { listReportsForAdmin } from "@/modules/reports/queries/admin-reports";

export default async function Page() {
  const reports = await listReportsForAdmin();
  return (
    <>
      <h1 className="text-3xl font-semibold">Denúncias</h1>
      <div className="mt-6 space-y-3">
        {reports.map((report) => (
          <Card key={report.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold">
                  {reportReasonLabels[report.reason]}
                </p>
                <Link
                  href={`/admin/anuncios/${report.listing.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {report.listing.title}
                </Link>
                <p className="mt-2 text-sm text-muted-foreground">
                  Por {report.reporter?.name ?? "Usuário removido"} ·{" "}
                  {report.status}
                </p>
                {report.details && (
                  <p className="mt-3 whitespace-pre-wrap text-sm">
                    {report.details}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {report.status === "OPEN" && (
                  <AdminActionButton
                    action={updateReportStatusAction}
                    values={{ id: report.id, status: "REVIEWING" }}
                    label="Analisar"
                  />
                )}
                {["OPEN", "REVIEWING"].includes(report.status) && (
                  <>
                    <AdminActionButton
                      action={updateReportStatusAction}
                      values={{ id: report.id, status: "RESOLVED" }}
                      label="Resolver"
                    />
                    <AdminActionButton
                      action={updateReportStatusAction}
                      values={{ id: report.id, status: "DISMISSED" }}
                      label="Descartar"
                      variant="ghost"
                    />
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
