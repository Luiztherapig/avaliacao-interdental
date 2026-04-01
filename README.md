# Interdental Avaliacao

MVP funcional de avaliacao de atendimento com landing publica, formulario dinamico, painel admin, versionamento de perguntas, gestao de dentistas, classificacao automatica e alerta por e-mail em casos criticos.

## Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Supabase Auth + Postgres
- Vercel
- Resend
- PostHog

## Setup local

1. Copie `.env.example` para `.env.local`.
2. Preencha as variaveis do Supabase, Resend e PostHog.
3. Instale dependencias:

```bash
npm install
```

4. Rode a migration principal no SQL Editor do Supabase:

- `supabase/migrations/20260330160000_initial_schema.sql`

5. Rode o seed inicial no SQL Editor do Supabase:

- `supabase/seed/seed.sql`

6. Crie os tres usuarios admin no Auth do Supabase.
7. Insira os perfis correspondentes em `admin_profiles`.
8. Inicie o projeto:

```bash
npm run dev
```

## Criacao dos admins

1. No painel do Supabase, acesse `Authentication > Users`.
2. Crie manualmente:
   - `admin1@interdental.com`
   - `admin2@interdental.com`
   - `admin3@interdental.com`
3. Copie o `UUID` de cada usuario criado.
4. Insira os perfis no banco:

```sql
insert into admin_profiles (auth_user_id, unit_id, full_name, email, role)
values
  ('UUID_ADMIN_1', '00000000-0000-0000-0000-000000000001', 'Admin 1', 'admin1@interdental.com', 'admin'),
  ('UUID_ADMIN_2', '00000000-0000-0000-0000-000000000001', 'Admin 2', 'admin2@interdental.com', 'admin'),
  ('UUID_ADMIN_3', '00000000-0000-0000-0000-000000000001', 'Admin 3', 'admin3@interdental.com', 'admin');
```

## Deploy gratuito

1. Suba o repositório para o GitHub.
2. Importe o projeto no Vercel.
3. Configure todas as variaveis do `.env.example`.
4. Aponte `NEXT_PUBLIC_APP_URL` para a URL final do Vercel.
5. Configure o dominio do Resend e `RESEND_FROM_EMAIL`.
6. Publique.

## Fluxo do MVP

- `/` landing publica
- `/avaliar` formulario publico
- `/obrigado` confirmacao
- `/login` acesso admin
- `/admin` dashboard
- `/admin/avaliacoes` listagem e detalhe
- `/admin/dentistas` CRUD
- `/admin/perguntas` versionamento
- `/admin/configuracoes` ajustes gerais
