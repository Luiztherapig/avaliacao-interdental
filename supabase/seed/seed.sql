insert into units (id, name, slug)
values ('00000000-0000-0000-0000-000000000001', 'Interdental', 'interdental')
on conflict (id) do nothing;

insert into app_settings (
  id,
  unit_id,
  public_form_enabled,
  critical_threshold_number,
  notification_emails_json,
  brand_name,
  landing_title,
  landing_subtitle
)
values (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  true,
  2.0,
  '["admin1@interdental.com","admin2@interdental.com","admin3@interdental.com"]'::jsonb,
  'Interdental',
  'Sua opinião ajuda a Interdental a cuidar melhor de cada atendimento.',
  'A avaliação é rápida, leva menos de 1 minuto e nos ajuda a evoluir com mais precisão.'
)
on conflict (unit_id) do nothing;

insert into dentists (id, unit_id, name, slug, specialty, is_active, display_order)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Dra. Mariana Costa', 'dra-mariana-costa', 'Ortodontia', true, 10),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Dr. Rafael Lima', 'dr-rafael-lima', 'Clínico Geral', true, 20),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'Dra. Beatriz Nunes', 'dra-beatriz-nunes', 'Implantodontia', true, 30)
on conflict do nothing;

insert into questionnaires (id, unit_id, version_number, title, description, status, published_at)
values (
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000001',
  1,
  'Pesquisa Equilibrada',
  'Versão inicial do MVP',
  'published',
  now()
)
on conflict do nothing;

insert into questions (
  id,
  questionnaire_id,
  code,
  label,
  description,
  type,
  is_required,
  is_active,
  display_order,
  options_json,
  conditional_logic_json,
  critical_answer_rules_json
)
values
  (
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000201',
    'q_overall_rating',
    'Como você avalia seu atendimento hoje?',
    'Selecione a carinha que melhor representa sua experiência.',
    'emoji_rating',
    true,
    true,
    10,
    null,
    null,
    '{"operator":"lte","value":2}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000201',
    'q_team_kindness',
    'Como você avalia a cordialidade da equipe?',
    null,
    'rating',
    true,
    true,
    20,
    null,
    null,
    null
  ),
  (
    '00000000-0000-0000-0000-000000000303',
    '00000000-0000-0000-0000-000000000201',
    'q_clear_guidance',
    'As orientações passadas foram claras?',
    null,
    'yes_no',
    true,
    true,
    30,
    null,
    null,
    '{"operator":"equals","value":false}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000304',
    '00000000-0000-0000-0000-000000000201',
    'q_expected_time',
    'Seu atendimento ocorreu dentro do esperado?',
    null,
    'yes_no',
    true,
    true,
    40,
    null,
    null,
    null
  ),
  (
    '00000000-0000-0000-0000-000000000305',
    '00000000-0000-0000-0000-000000000201',
    'q_negative_reason',
    'O que mais impactou negativamente sua experiência?',
    'Esta pergunta aparece apenas quando a nota geral é baixa.',
    'text',
    true,
    true,
    50,
    null,
    '{"dependsOnQuestionCode":"q_overall_rating","operator":"lte","value":2,"requiredWhenVisible":true}'::jsonb,
    null
  )
on conflict do nothing;
