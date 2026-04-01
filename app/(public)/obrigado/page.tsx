import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const messages: Record<string, string> = {
  critico: "Agradecemos sua sinceridade. Sua resposta foi registrada e será analisada com atenção pela nossa equipe.",
  atencao: "Obrigado por compartilhar sua percepção. Sua resposta nos ajuda a melhorar continuamente.",
  neutro: "Sua avaliação foi registrada com sucesso. Obrigado por dedicar esse momento.",
  elogio: "Obrigado por compartilhar sua experiência. Sua opinião fortalece o trabalho da equipe."
};

export default async function ThankYouPage({
  searchParams
}: {
  searchParams: Promise<{ classification?: string }>;
}) {
  const { classification } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="max-w-xl p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Avaliação concluída</p>
        <h1 className="mt-4 text-3xl">Obrigado pela sua avaliação.</h1>
        <p className="mt-4 text-slate-600">
          {messages[classification ?? "neutro"] ??
            "Sua resposta foi registrada com sucesso. Ela nos ajuda a melhorar continuamente o cuidado com cada paciente."}
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/">Voltar ao início</Link>
          </Button>
        </div>
      </Card>
    </main>
  );
}
