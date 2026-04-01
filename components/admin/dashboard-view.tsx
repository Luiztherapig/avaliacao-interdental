import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime, formatPercent, formatScore } from "@/lib/utils";

type DashboardData = Awaited<ReturnType<typeof import("@/lib/queries/admin").getDashboardData>>;

export function DashboardView({ data }: { data: DashboardData }) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Total de avaliações</p>
          <p className="mt-3 text-3xl font-semibold">{data.totalSubmissions}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Nota média geral</p>
          <p className="mt-3 text-3xl font-semibold">{formatScore(data.averageScore)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Avaliações críticas</p>
          <p className="mt-3 text-3xl font-semibold">{data.criticalCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Percentual crítico</p>
          <p className="mt-3 text-3xl font-semibold">{formatPercent(data.criticalRate)}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl">Tendência diária</h2>
            <Badge>{data.trend.length} dias</Badge>
          </div>
          <div className="grid gap-3">
            {data.trend.length === 0 ? (
              <p className="text-sm text-slate-500">Ainda não há avaliações no período selecionado.</p>
            ) : (
              data.trend.map((point) => (
                <div key={point.date} className="grid grid-cols-[120px_1fr_50px] items-center gap-3">
                  <span className="text-sm text-slate-500">{point.date}</span>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full bg-cyan-600"
                      style={{
                        width: `${Math.max(10, (point.total / Math.max(...data.trend.map((item) => item.total))) * 100)}%`
                      }}
                    />
                  </div>
                  <span className="text-right text-sm font-medium">{point.total}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-xl">Últimas críticas</h2>
          <div className="mt-5 grid gap-3">
            {data.latestCritical.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma avaliação crítica recente.</p>
            ) : (
              data.latestCritical.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/avaliacoes/${item.id}`}
                  className="rounded-2xl border bg-rose-50/50 p-4 transition hover:border-rose-200"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{item.dentistName}</p>
                    <Badge tone="destructive">Crítico</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{formatDateTime(item.submittedAt)}</p>
                  <p className="mt-2 text-sm text-rose-700">{item.criticalReason}</p>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl">Dentistas</h2>
          <Badge>{data.dentists.length} profissionais</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="pb-3">Dentista</th>
                <th className="pb-3">Volume</th>
                <th className="pb-3">Média</th>
                <th className="pb-3">% crítico</th>
              </tr>
            </thead>
            <tbody>
              {data.dentists.map((item) => (
                <tr key={item.dentistId} className="border-t">
                  <td className="py-4 font-medium">{item.dentistName}</td>
                  <td className="py-4">{item.total}</td>
                  <td className="py-4">{formatScore(item.averageScore)}</td>
                  <td className="py-4">{formatPercent(item.total ? item.criticalCount / item.total : 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
