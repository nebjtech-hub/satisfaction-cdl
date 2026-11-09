-- =====================================================================
-- Satisfaction patient CDL — Baromètre Vague 1
-- À exécuter une fois dans Supabase > SQL Editor
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Administrateurs (accès au tableau de bord)
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  nom        text,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

drop policy if exists "admin_voit_sa_ligne" on public.admins;
create policy "admin_voit_sa_ligne" on public.admins
  for select to authenticated using (user_id = auth.uid());

revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Réponses au questionnaire
--    Notes : 1 à 5, 0 = « Non concerné » (ou « Pas d'examen » pour C4)
-- ---------------------------------------------------------------------
create table if not exists public.reponses (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  vague           smallint not null default 1,
  canal           text not null default 'direct'
                  check (canal in ('accueil','salle_attente','caisse','sortie','sms','direct')),
  parcours        text not null check (parcours in ('consultation','sejour')),

  -- Parcours Consultation
  c1 smallint check (c1 between 0 and 5),
  c2 text     check (c2 in ('moins_15','15_30','30_60','plus_60')),
  c3 smallint check (c3 between 0 and 5),
  c4 smallint check (c4 between 0 and 5),
  c5 smallint check (c5 between 0 and 5),
  c6 smallint check (c6 between 0 and 5),   -- facturation (optionnelle, désactivée par défaut)

  -- Parcours Séjour
  s1 text     check (s1 in ('medecine','chirurgie','maternite')),
  s2 smallint check (s2 between 0 and 5),
  s3 smallint check (s3 between 0 and 5),
  s4 smallint check (s4 between 0 and 5),
  s5 smallint check (s5 between 0 and 5),
  s6 smallint check (s6 between 0 and 5),

  -- Questions de fin communes
  f1 smallint not null check (f1 between 1 and 5),
  f2 smallint not null check (f2 between 0 and 10),
  f3 text not null check (f3 in ('accueil','attente','explications','ecoute','proprete',
                                  'repas','resultats','tarifs','sortie','rien','autre')),
  f3_autre  text check (char_length(f3_autre) <= 300),
  f4        text check (char_length(f4) <= 2000),
  f5        boolean,
  telephone text check (telephone ~ '^\+?[0-9 ]{8,18}$'),

  -- Analyse
  theme_verbatim text check (theme_verbatim in ('accueil','attente','explications','ecoute','proprete',
                                                 'repas','resultats','tarifs','sortie','autre')),
  duree_secondes integer check (duree_secondes between 0 and 86400),

  constraint parcours_coherent check (
    (parcours = 'consultation'
      and c1 is not null and c2 is not null and c3 is not null and c4 is not null and c5 is not null
      and s1 is null and s2 is null and s3 is null and s4 is null and s5 is null and s6 is null)
    or
    (parcours = 'sejour'
      and s1 is not null and s2 is not null and s3 is not null and s4 is not null and s5 is not null and s6 is not null
      and c1 is null and c2 is null and c3 is null and c4 is null and c5 is null and c6 is null)
  ),
  constraint f3_coherent check (
    not (parcours = 'consultation' and f3 in ('repas','sortie'))
    and not (parcours = 'sejour' and f3 = 'resultats')
  ),
  constraint f3_autre_coherent check ((f3 = 'autre') = (f3_autre is not null)),
  constraint telephone_coherent check (telephone is null or f5 is true)
);

create index if not exists reponses_created_at_idx on public.reponses (created_at desc);
create index if not exists reponses_parcours_idx   on public.reponses (parcours, created_at desc);

alter table public.reponses enable row level security;

-- Le public (patients) peut uniquement déposer une réponse, jamais lire.
drop policy if exists "depot_public" on public.reponses;
create policy "depot_public" on public.reponses
  for insert to anon, authenticated
  with check (vague = 1 and theme_verbatim is null);

-- Les administrateurs lisent, classent les verbatims et suppriment les tests.
drop policy if exists "lecture_admin" on public.reponses;
create policy "lecture_admin" on public.reponses
  for select to authenticated using (public.is_admin());

drop policy if exists "classement_admin" on public.reponses;
create policy "classement_admin" on public.reponses
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "suppression_admin" on public.reponses;
create policy "suppression_admin" on public.reponses
  for delete to authenticated using (public.is_admin());

-- Droits par colonne : le public ne choisit ni l'id, ni la date, ni le classement.
revoke all on public.reponses from anon, authenticated;
grant insert (vague, canal, parcours,
              c1, c2, c3, c4, c5, c6,
              s1, s2, s3, s4, s5, s6,
              f1, f2, f3, f3_autre, f4, f5, telephone,
              duree_secondes)
  on public.reponses to anon, authenticated;
grant select, delete on public.reponses to authenticated;
grant update (theme_verbatim) on public.reponses to authenticated;

-- ---------------------------------------------------------------------
-- 3. Déclarer un administrateur
--    a) Supabase > Authentication > Users > Add user (e-mail + mot de passe)
--    b) Puis exécuter (en remplaçant l'e-mail) :
-- ---------------------------------------------------------------------
-- insert into public.admins (user_id, nom)
-- select id, 'Service Expérience Patient & Hospitalité'
-- from auth.users where email = 'prenom.nom@centre-diagnostic.com';
