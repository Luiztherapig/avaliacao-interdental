import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime, formatScore } from "@/lib/utils";

type Submission = Awaited<ReturnType<typeof import("@/lib/queries/admin").getSubmissions>>[number];

export function SubmissionsTable({ submissions }: { submissions: Submission[] }) {
  return (
    <Card className="p-5">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="pb-3">Data/Hora</th>
              <th className="pb-3">Dentista</th>
              <th className="pb-3">Nota</th>
              <th className="pb-3">Classificação</th>
              <th className="pb-3">Origem</th>
              <th className="pb-3">Ação</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="py-4">{formatDateTime(item.submitted_at)}</td>
                <td className="py-4 font-medium">{item.dentist_name_snapshot}</td>
                <td className="py-4">{formatScore(Number(item.rating_overall))}</td>
                <td className="py-4">
                  <Badge
                    tone={
                      item.classification === "critico"
                        ? "destructive"
                        : item.classification === "atencao"
                          ? "warning"
                          : item.classification === "elogio"
                            ? "success"
                            : "default"
                    }
                  >
                    {item.classification}
                  </Badge>
                </td>
                <td className="py-4">{item.source}</td>
                <td className="py-4">
                  <Link className="text-cyan-700 hover:underline" href={`/admin/avaliacoes/${item.id}`}>
                    Ver detalhe
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
