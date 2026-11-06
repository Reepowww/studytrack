begin;

drop function if exists public.finish_ten_day_email(uuid, uuid, boolean);
drop function if exists public.claim_ten_day_email(uuid, uuid);
drop function if exists public.set_email_reminders_enabled(uuid, boolean);
drop function if exists public.get_email_reminders_enabled(uuid);
drop table if exists public.email_notification_state;

commit;
