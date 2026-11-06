begin;

create table public.email_notification_state (
  user_id uuid primary key
    references auth.users (id) on delete cascade,
  reminders_enabled boolean not null default false,
  ten_day_last_sent_at timestamptz,
  ten_day_claim_token uuid,
  ten_day_claim_expires_at timestamptz,
  constraint email_notification_state_claim_pair check (
    (ten_day_claim_token is null and ten_day_claim_expires_at is null)
    or
    (ten_day_claim_token is not null and ten_day_claim_expires_at is not null)
  )
);

comment on table public.email_notification_state is
  'Server-side opt-in and 10-day email cooldown state; accessible only through trusted Edge Function RPCs.';
comment on column public.email_notification_state.user_id is
  'One row per Supabase Auth user. The primary key also provides the lookup index.';
comment on column public.email_notification_state.ten_day_claim_token is
  'Temporary atomic claim used to prevent concurrent 10-day reminder sends.';

alter table public.email_notification_state enable row level security;

create policy email_notification_state_deny_direct_access
  on public.email_notification_state
  as restrictive
  for all
  to public
  using (false)
  with check (false);

revoke all on table public.email_notification_state
  from public, anon, authenticated, service_role;

create or replace function public.get_email_reminders_enabled(
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select s.reminders_enabled
      from public.email_notification_state as s
      where s.user_id = p_user_id
    ),
    false
  );
$$;

create or replace function public.set_email_reminders_enabled(
  p_user_id uuid,
  p_enabled boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null then
    raise exception 'User ID is required' using errcode = '22004';
  end if;

  if p_enabled is null then
    raise exception 'Preference is required' using errcode = '22004';
  end if;

  insert into public.email_notification_state (user_id, reminders_enabled)
  values (p_user_id, p_enabled)
  on conflict (user_id)
  do update set reminders_enabled = excluded.reminders_enabled;

  return p_enabled;
end;
$$;

create or replace function public.claim_ten_day_email(
  p_user_id uuid,
  p_claim_token uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claimed boolean := false;
  v_enabled boolean;
  v_last_sent timestamptz;
begin
  if p_user_id is null or p_claim_token is null then
    raise exception 'User ID and claim token are required'
      using errcode = '22004';
  end if;

  update public.email_notification_state as s
  set ten_day_claim_token = p_claim_token,
      ten_day_claim_expires_at =
        pg_catalog.clock_timestamp() + interval '10 minutes'
  where s.user_id = p_user_id
    and s.reminders_enabled
    and (
      s.ten_day_last_sent_at is null
      or s.ten_day_last_sent_at
        <= pg_catalog.clock_timestamp() - interval '10 days'
    )
    and (
      s.ten_day_claim_token is null
      or s.ten_day_claim_expires_at <= pg_catalog.clock_timestamp()
    )
  returning true into v_claimed;

  if coalesce(v_claimed, false) then
    return 'claimed';
  end if;

  select s.reminders_enabled, s.ten_day_last_sent_at
    into v_enabled, v_last_sent
  from public.email_notification_state as s
  where s.user_id = p_user_id;

  if not found or not coalesce(v_enabled, false) then
    return 'disabled';
  end if;

  if v_last_sent is not null
     and v_last_sent > pg_catalog.clock_timestamp() - interval '10 days' then
    return 'cooldown';
  end if;

  return 'in_progress';
end;
$$;

create or replace function public.finish_ten_day_email(
  p_user_id uuid,
  p_claim_token uuid,
  p_provider_accepted boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null
     or p_claim_token is null
     or p_provider_accepted is null then
    raise exception 'User ID, claim token, and provider result are required'
      using errcode = '22004';
  end if;

  update public.email_notification_state as s
  set ten_day_last_sent_at =
        case
          when p_provider_accepted then pg_catalog.clock_timestamp()
          else s.ten_day_last_sent_at
        end,
      ten_day_claim_token = null,
      ten_day_claim_expires_at = null
  where s.user_id = p_user_id
    and s.ten_day_claim_token = p_claim_token;

  return found;
end;
$$;

revoke all on function public.get_email_reminders_enabled(uuid)
  from public, anon, authenticated;
revoke all on function public.set_email_reminders_enabled(uuid, boolean)
  from public, anon, authenticated;
revoke all on function public.claim_ten_day_email(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.finish_ten_day_email(uuid, uuid, boolean)
  from public, anon, authenticated;

grant execute on function public.get_email_reminders_enabled(uuid)
  to service_role;
grant execute on function public.set_email_reminders_enabled(uuid, boolean)
  to service_role;
grant execute on function public.claim_ten_day_email(uuid, uuid)
  to service_role;
grant execute on function public.finish_ten_day_email(uuid, uuid, boolean)
  to service_role;

commit;
