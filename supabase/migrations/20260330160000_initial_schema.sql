create extension if not exists "pgcrypto";

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists units (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists admin_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  unit_id uuid not null references units(id),
  full_name text not null,
  email text not null,
  role text not null check (role = 'admin'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists dentists (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id),
  name text not null,
  slug text not null,
  specialty text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (unit_id, slug)
);

create table if not exists questionnaires (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id),
  version_number integer not null,
  title text not null,
  description text,
  status text not null check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid references admin_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (unit_id, version_number)
);

create unique index if not exists questionnaires_one_published_per_unit_idx
  on questionnaires(unit_id)
  where status = 'published';

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references questionnaires(id) on delete restrict,
  code text not null,
  label text not null,
  description text,
  type text not null check (type in ('emoji_rating', 'rating', 'yes_no', 'single_choice', 'text')),
  is_required boolean not null default true,
  is_active boolean not null default true,
  display_order integer not null default 0,
  options_json jsonb,
  conditional_logic_json jsonb,
  critical_answer_rules_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (questionnaire_id, code)
);

create table if not exists app_settings (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null unique references units(id),
  public_form_enabled boolean not null default true,
  critical_threshold_number numeric(3,1) not null default 2.0 check (critical_threshold_number >= 1 and critical_threshold_number <= 5),
  notification_emails_json jsonb not null default '[]'::jsonb,
  brand_name text,
  whatsapp_link text,
  landing_title text,
  landing_subtitle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists survey_submissions (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id),
  questionnaire_id uuid not null references questionnaires(id),
  dentist_id uuid not null references dentists(id),
  dentist_name_snapshot text not null,
  source text not null check (source in ('qr', 'whatsapp', 'direct')),
  rating_overall numeric(3,1) not null check (rating_overall >= 1 and rating_overall <= 5),
  comment_text text,
  classification text not null check (classification in ('elogio', 'neutro', 'atencao', 'critico')),
  is_critical boolean not null default false,
  critical_reason text,
  submitted_at timestamptz not null default now(),
  session_id text,
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create table if not exists survey_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references survey_submissions(id) on delete cascade,
  question_id uuid not null references questions(id),
  question_code_snapshot text not null,
  question_label_snapshot text not null,
  question_type_snapshot text not null,
  answer_text text,
  answer_number numeric(10,2),
  answer_boolean boolean,
  answer_option text,
  created_at timestamptz not null default now()
);

create table if not exists critical_alerts (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references survey_submissions(id) on delete cascade,
  trigger_type text not null check (trigger_type in ('overall_threshold', 'question_rule', 'combined')),
  trigger_reason text not null,
  email_sent boolean not null default false,
  email_sent_at timestamptz,
  email_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id),
  admin_profile_id uuid not null references admin_profiles(id),
  action_type text not null,
  entity_type text not null,
  entity_id uuid not null,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_dentists_unit_active on dentists(unit_id, is_active, display_order);
create index if not exists idx_questionnaires_unit_status on questionnaires(unit_id, status);
create index if not exists idx_questions_questionnaire_order on questions(questionnaire_id, display_order);
create index if not exists idx_submissions_unit_date on survey_submissions(unit_id, submitted_at desc);
create index if not exists idx_submissions_critical on survey_submissions(unit_id, is_critical, submitted_at desc);
create index if not exists idx_submissions_dentist_date on survey_submissions(dentist_id, submitted_at desc);
create index if not exists idx_answers_submission on survey_answers(submission_id);

create or replace function is_admin_of_unit(target_unit_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from admin_profiles ap
    where ap.auth_user_id = auth.uid()
      and ap.unit_id = target_unit_id
      and ap.is_active = true
      and ap.role = 'admin'
  );
$$;

alter table units enable row level security;
alter table admin_profiles enable row level security;
alter table dentists enable row level security;
alter table questionnaires enable row level security;
alter table questions enable row level security;
alter table app_settings enable row level security;
alter table survey_submissions enable row level security;
alter table survey_answers enable row level security;
alter table critical_alerts enable row level security;
alter table audit_logs enable row level security;

create policy "units_select_admin" on units
  for select using (is_admin_of_unit(id));

create policy "admin_profiles_select_admin" on admin_profiles
  for select using (is_admin_of_unit(unit_id));

create policy "dentists_select_admin" on dentists
  for select using (is_admin_of_unit(unit_id));

create policy "dentists_manage_admin" on dentists
  for all using (is_admin_of_unit(unit_id)) with check (is_admin_of_unit(unit_id));

create policy "questionnaires_select_admin" on questionnaires
  for select using (is_admin_of_unit(unit_id));

create policy "questionnaires_manage_admin" on questionnaires
  for all using (is_admin_of_unit(unit_id)) with check (is_admin_of_unit(unit_id));

create policy "questions_select_admin" on questions
  for select using (
    exists (
      select 1 from questionnaires q
      where q.id = questions.questionnaire_id
        and is_admin_of_unit(q.unit_id)
    )
  );

create policy "questions_manage_admin" on questions
  for all using (
    exists (
      select 1 from questionnaires q
      where q.id = questions.questionnaire_id
        and is_admin_of_unit(q.unit_id)
        and q.status = 'draft'
    )
  )
  with check (
    exists (
      select 1 from questionnaires q
      where q.id = questions.questionnaire_id
        and is_admin_of_unit(q.unit_id)
        and q.status = 'draft'
    )
  );

create policy "app_settings_admin" on app_settings
  for all using (is_admin_of_unit(unit_id)) with check (is_admin_of_unit(unit_id));

create policy "submissions_select_admin" on survey_submissions
  for select using (is_admin_of_unit(unit_id));

create policy "answers_select_admin" on survey_answers
  for select using (
    exists (
      select 1 from survey_submissions s
      where s.id = survey_answers.submission_id
        and is_admin_of_unit(s.unit_id)
    )
  );

create policy "critical_alerts_select_admin" on critical_alerts
  for select using (
    exists (
      select 1 from survey_submissions s
      where s.id = critical_alerts.submission_id
        and is_admin_of_unit(s.unit_id)
    )
  );

create policy "audit_logs_select_admin" on audit_logs
  for select using (is_admin_of_unit(unit_id));

create trigger units_updated_at before update on units
  for each row execute function set_updated_at();
create trigger admin_profiles_updated_at before update on admin_profiles
  for each row execute function set_updated_at();
create trigger dentists_updated_at before update on dentists
  for each row execute function set_updated_at();
create trigger questionnaires_updated_at before update on questionnaires
  for each row execute function set_updated_at();
create trigger questions_updated_at before update on questions
  for each row execute function set_updated_at();
create trigger app_settings_updated_at before update on app_settings
  for each row execute function set_updated_at();
create trigger critical_alerts_updated_at before update on critical_alerts
  for each row execute function set_updated_at();
