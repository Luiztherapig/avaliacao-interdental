import { addDays, formatISO, subDays } from "@/lib/queries/date";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getDashboardData(unitId: string, params?: { from?: string; to?: string; dentistId?: string }) {
  const supabase = createAdminClient();
  const from = params?.from ?? formatISO(subDays(new Date(), 29));
  const to = params?.to ?? formatISO(addDays(new Date(), 1));

  let query = supabase
    .from("survey_submissions")
    .select(
      "id, dentist_id, dentist_name_snapshot, rating_overall, classification, is_critical, critical_reason, submitted_at, comment_text"
    )
    .eq("unit_id", unitId)
    .gte("submitted_at", from)
    .lt("submitted_at", to)
    .order("submitted_at", { ascending: false });

  if (params?.dentistId) {
    query = query.eq("dentist_id", params.dentistId);
  }

  const { data: submissions } = await query;
  const rows = submissions ?? [];

  const totalSubmissions = rows.length;
  const averageScore =
    rows.length > 0
      ? rows.reduce((acc, item) => acc + Number(item.rating_overall), 0) / rows.length
      : null;
  const criticalCount = rows.filter((item) => item.is_critical).length;
  const withComments = rows.filter((item) => item.comment_text && item.comment_text.trim()).length;

  const classificationMap = new Map<string, number>([
    ["elogio", 0],
    ["neutro", 0],
    ["atencao", 0],
    ["critico", 0]
  ]);

  for (const row of rows) {
    classificationMap.set(row.classification, (classificationMap.get(row.classification) ?? 0) + 1);
  }

  const trendMap = new Map<string, number>();
  for (const row of rows) {
    const date = row.submitted_at.slice(0, 10);
    trendMap.set(date, (trendMap.get(date) ?? 0) + 1);
  }

  const dentistMap = new Map<
    string,
    { dentistId: string; dentistName: string; total: number; scoreSum: number; criticalCount: number }
  >();

  for (const row of rows) {
    const existing = dentistMap.get(row.dentist_id) ?? {
      dentistId: row.dentist_id,
      dentistName: row.dentist_name_snapshot,
      total: 0,
      scoreSum: 0,
      criticalCount: 0
    };
    existing.total += 1;
    existing.scoreSum += Number(row.rating_overall);
    existing.criticalCount += row.is_critical ? 1 : 0;
    dentistMap.set(row.dentist_id, existing);
  }

  return {
    totalSubmissions,
    averageScore,
    criticalCount,
    criticalRate: totalSubmissions ? criticalCount / totalSubmissions : 0,
    withComments,
    classificationBreakdown: Array.from(classificationMap.entries()).map(([label, count]) => ({
      label,
      count
    })),
    trend: Array.from(trendMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date, total })),
    dentists: Array.from(dentistMap.values())
      .map((item) => ({
        dentistId: item.dentistId,
        dentistName: item.dentistName,
        total: item.total,
        averageScore: item.total ? item.scoreSum / item.total : null,
        criticalCount: item.criticalCount
      }))
      .sort((a, b) => b.total - a.total),
    latestCritical: rows
      .filter((item) => item.is_critical)
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        submittedAt: item.submitted_at,
        dentistName: item.dentist_name_snapshot,
        ratingOverall: Number(item.rating_overall),
        criticalReason: item.critical_reason
      }))
  };
}

export async function getDentists(unitId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("dentists")
    .select("id, name, specialty, is_active, display_order, updated_at")
    .eq("unit_id", unitId)
    .order("display_order", { ascending: true });

  return (data ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    specialty: item.specialty,
    isActive: item.is_active,
    displayOrder: item.display_order,
    updatedAt: item.updated_at
  }));
}

export async function getQuestionnaires(unitId: string) {
  const supabase = createAdminClient();
  const { data: versions } = await supabase
    .from("questionnaires")
    .select("id, version_number, title, description, status, published_at, created_at")
    .eq("unit_id", unitId)
    .order("version_number", { ascending: false });

  const activeDraft = versions?.find((item) => item.status === "draft") ?? null;

  if (!activeDraft) {
    return {
      versions: (versions ?? []).map((item) => ({
        id: item.id,
        versionNumber: item.version_number,
        title: item.title,
        status: item.status,
        publishedAt: item.published_at
      })),
      activeDraft: null
    };
  }

  const { data: questions } = await supabase
    .from("questions")
    .select(
      "id, code, label, description, type, is_required, is_active, display_order, options_json, conditional_logic_json, critical_answer_rules_json"
    )
    .eq("questionnaire_id", activeDraft.id)
    .order("display_order", { ascending: true });

  return {
    versions: (versions ?? []).map((item) => ({
      id: item.id,
      versionNumber: item.version_number,
      title: item.title,
      status: item.status,
      publishedAt: item.published_at
    })),
    activeDraft: {
      id: activeDraft.id,
      title: activeDraft.title,
      description: activeDraft.description,
      versionNumber: activeDraft.version_number,
      questions: (questions ?? []).map((item) => ({
        id: item.id,
        code: item.code,
        label: item.label,
        description: item.description,
        type: item.type,
        isRequired: item.is_required,
        isActive: item.is_active,
        displayOrder: item.display_order,
        options: Array.isArray(item.options_json) ? (item.options_json as Array<{ label: string; value: string }>) : [],
        conditionalRule: item.conditional_logic_json,
        criticalRule: item.critical_answer_rules_json
      }))
    }
  };
}

export async function getSettings(unitId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("app_settings")
    .select(
      "public_form_enabled, critical_threshold_number, notification_emails_json, brand_name, whatsapp_link, landing_title, landing_subtitle"
    )
    .eq("unit_id", unitId)
    .single();

  return {
    publicFormEnabled: data?.public_form_enabled ?? true,
    criticalThresholdNumber: Number(data?.critical_threshold_number ?? 2),
    notificationEmails: Array.isArray(data?.notification_emails_json) ? data.notification_emails_json : [],
    brandName: data?.brand_name ?? "",
    whatsappLink: data?.whatsapp_link ?? "",
    landingTitle: data?.landing_title ?? "",
    landingSubtitle: data?.landing_subtitle ?? ""
  };
}

export async function getSubmissions(unitId: string, params?: { dentistId?: string; classification?: string }) {
  const supabase = createAdminClient();
  let query = supabase
    .from("survey_submissions")
    .select(
      "id, submitted_at, dentist_id, dentist_name_snapshot, rating_overall, classification, is_critical, source, comment_text"
    )
    .eq("unit_id", unitId)
    .order("submitted_at", { ascending: false });

  if (params?.dentistId) {
    query = query.eq("dentist_id", params.dentistId);
  }
  if (params?.classification) {
    query = query.eq("classification", params.classification);
  }

  const { data } = await query.limit(100);
  return data ?? [];
}

export async function getSubmissionDetail(unitId: string, submissionId: string) {
  const supabase = createAdminClient();

  const { data: submission } = await supabase
    .from("survey_submissions")
    .select("*")
    .eq("id", submissionId)
    .eq("unit_id", unitId)
    .single();

  if (!submission) return null;

  const [{ data: answers }, { data: alert }] = await Promise.all([
    supabase
      .from("survey_answers")
      .select("*")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: true }),
    supabase.from("critical_alerts").select("*").eq("submission_id", submissionId).maybeSingle()
  ]);

  return {
    submission,
    answers: answers ?? [],
    alert
  };
}
