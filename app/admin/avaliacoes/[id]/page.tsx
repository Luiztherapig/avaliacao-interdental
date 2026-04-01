import Link from "next/link";
import { notFound } from "next/navigation";

import { SubmissionDetail } from "@/components/admin/submission-detail";
import { Button } from "@/components/ui/button";
import { getSubmissionDetail } from "@/lib/queries/admin";
import { requireAdmin } from "@/lib/supabase/auth";

export default async function AdminSubmissionDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireAdmin();
  const detail = await getSubmissionDetail(profile.unit_id, id);

  if (!detail) {
    notFound();
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Avaliação</p>
          <h1 className="mt-2 text-3xl">Detalhe da resposta</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/avaliacoes">Voltar</Link>
        </Button>
      </div>
      <SubmissionDetail detail={detail} />
    </div>
  );
}
