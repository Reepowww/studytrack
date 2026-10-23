create table if not exists public.grade_planner_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  passing_grade numeric not null default 75
    check (passing_grade >= 0 and passing_grade <= 100),
  gwa_mode text not null default 'units'
    check (gwa_mode in ('units', 'manual')),
  manual_gwa jsonb not null default '{}'::jsonb
    check (jsonb_typeof(manual_gwa) = 'object'),
  created_at timestamptz not null default now()
);

create table if not exists public.grade_planner_subject_settings (
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id bigint not null references public.subjects (id) on delete cascade,
  units numeric null check (units is null or units > 0),
  weights jsonb not null default '{}'::jsonb
    check (jsonb_typeof(weights) = 'object'),
  created_at timestamptz not null default now(),
  primary key (user_id, subject_id)
);

alter table public.grade_planner_preferences enable row level security;
alter table public.grade_planner_subject_settings enable row level security;

create policy "Users manage their own grade planner preferences"
  on public.grade_planner_preferences
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own grade planner subject settings"
  on public.grade_planner_subject_settings
  for all
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.subjects as subject
      where subject.id = grade_planner_subject_settings.subject_id
        and subject.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.subjects as subject
      where subject.id = grade_planner_subject_settings.subject_id
        and subject.user_id = auth.uid()
    )
  );

grant select, insert, update, delete
  on public.grade_planner_preferences, public.grade_planner_subject_settings
  to authenticated;
