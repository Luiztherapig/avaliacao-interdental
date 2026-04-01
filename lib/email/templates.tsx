type CriticalEmailProps = {
  dentistName: string;
  submittedAt: string;
  ratingOverall: number;
  criticalReason: string;
  commentText?: string | null;
  adminUrl: string;
};

export function criticalAlertEmail(props: CriticalEmailProps) {
  return `
    <div style="font-family: Arial, sans-serif; color: #163045;">
      <h2 style="margin-bottom: 8px;">Avaliação crítica recebida</h2>
      <p style="margin: 0 0 12px;">Uma nova avaliação crítica foi registrada no sistema da Interdental.</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 520px;">
        <tr><td style="padding: 6px 0; font-weight: 700;">Dentista</td><td style="padding: 6px 0;">${props.dentistName}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: 700;">Data/Hora</td><td style="padding: 6px 0;">${props.submittedAt}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: 700;">Nota geral</td><td style="padding: 6px 0;">${props.ratingOverall.toFixed(1)}</td></tr>
        <tr><td style="padding: 6px 0; font-weight: 700;">Motivo</td><td style="padding: 6px 0;">${props.criticalReason}</td></tr>
      </table>
      ${
        props.commentText
          ? `<p style="margin-top: 12px;"><strong>Comentário:</strong><br/>${props.commentText}</p>`
          : ""
      }
      <p style="margin-top: 18px;">
        <a href="${props.adminUrl}" style="background:#0f6e8a;color:white;padding:10px 16px;text-decoration:none;border-radius:8px;">
          Abrir painel
        </a>
      </p>
    </div>
  `;
}
