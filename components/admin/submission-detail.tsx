import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateTime, formatScore } from "@/lib/utils";

type Detail = NonNullable<Awaited<ReturnType<typeof import("@/lib/queries/admin").getSubmissionDetail>>>;

export function SubmissionDetail({ detail }: { detail: Detail }) {
  const { submission, answers, alert } = detail;

  return (
    <div className="grid gap-6">
      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-slate-500">Data/Hora</p>
            <p className="mt-2 font-semibold">{formatDateTime(submission.submitted_at)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Dentista</p>
            <p className="mt-2 font-semibold">{submission.dentist_name_snapshot}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Nota geral</p>
            <p className="mt-2 font-semibold">{formatScore(Number(submission.rating_overall))}</p>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <Badge
            tone={
              submission.classification === "critico"
                ? "destructive"
                : submission.classification === "atencao"
                  ? "warning"
                  : submission.classification === "elogio"
                    ? "success"
                    : "default"
            }
          >
            {submission.classification}
          </Badge>
          <Badge>{submission.source}</Badge>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-xl">Respostas</h2>
        <div className="mt-5 space-y-4">
          {answers.map((answer) => (
            <div key={answer.id} className="rounded-2xl border p-4">
              <p className="font-semibold">{answer.question_label_snapshot}</p>
              <p className="mt-2 text-slate-600">
                {answer.answer_text ??
                  answer.answer_option ??
                  (answer.answer_boolean === null ? null : answer.answer_boolean ? "Sim" : "Não") ??
                  answer.answer_number}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-xl">Comentário</h2>
        <p className="mt-4 text-slate-600">{submission.comment_text || "Nenhum comentário informado."}</p>
      </Card>

      <Card className="p-5">
        <h2 className="text-xl">Alerta crítico</h2>
        <div className="mt-4 grid gap-3">
          <p className="text-sm text-slate-600">Motivo: {submission.critical_reason || "Sem gatilho crítico."}</p>
          <p className="text-sm text-slate-600">E-mail enviado: {alert?.email_sent ? "Sim" : "Não"}</p>
          {alert?.email_error ? <p className="text-sm text-rose-600">Erro: {alert.email_error}</p> : null}
        </div>
      </Card>
    </div>
  );
}
