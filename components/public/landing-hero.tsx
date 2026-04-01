import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function LandingHero({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <section className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8">
      <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div className="space-y-8">
          <Image
            src="/logo-interdental.png"
            alt="Interdental"
            width={180}
            height={60}
            priority
            className="h-auto w-auto"
          />

          <div className="inline-flex w-fit rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-800 shadow-sm">
            Sua opinião é importante
          </div>

          <div className="space-y-5">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              {title}
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-600 md:text-lg md:leading-8">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              className="rounded-xl px-5 py-2 text-sm font-semibold"
            >
              <Link href="/avaliar">Avaliar atendimento</Link>
            </Button>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              Leva menos de 1 minuto e sua resposta é registrada com segurança.
            </div>
          </div>
        </div>

        <Card className="grid gap-4 rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
              Avaliação em menos de 1 minuto
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
              Ajude a equipe a evoluir com mais precisão.
            </h2>
          </div>

          <div className="grid gap-3">
            {[
              "Escolha o dentista que realizou o atendimento",
              "Responda poucas perguntas objetivas",
              "Se quiser, deixe um comentário ao final",
            ].map((item, index) => (
              <div key={item} className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600 text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <p className="text-sm text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}