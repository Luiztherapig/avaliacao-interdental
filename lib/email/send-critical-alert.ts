import { Resend } from "resend";

import { criticalAlertEmail } from "@/lib/email/templates";

export async function sendCriticalAlertEmail(params: {
  to: string[];
  dentistName: string;
  submittedAt: string;
  ratingOverall: number;
  criticalReason: string;
  commentText?: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!apiKey || !from || !appUrl) {
    throw new Error("Configuração de e-mail incompleta.");
  }

  const resend = new Resend(apiKey);

  return resend.emails.send({
    from,
    to: params.to,
    subject: "Interdental | Avaliação crítica recebida",
    html: criticalAlertEmail({
      dentistName: params.dentistName,
      submittedAt: params.submittedAt,
      ratingOverall: params.ratingOverall,
      criticalReason: params.criticalReason,
      commentText: params.commentText,
      adminUrl: `${appUrl}/admin/avaliacoes`
    })
  });
}
