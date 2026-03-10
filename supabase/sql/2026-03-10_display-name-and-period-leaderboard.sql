-- Minimal script focused only on saving public display names.
-- Safe, idempotent, and non-destructive.

alter table if exists public.profiles
  add column if not exists display_name text;

comment on column public.profiles.display_name is
  'Public name shown in leaderboard. Should not be an email.';

create or replace function public.set_my_display_name(p_display_name text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_clean text := btrim(coalesce(p_display_name, ''));
begin
  if v_uid is null then
    raise exception 'User not authenticated';
  end if;

  if length(v_clean) < 3 then
    raise exception 'Display name must have at least 3 characters';
  end if;

  if length(v_clean) > 24 then
    raise exception 'Display name must have at most 24 characters';
  end if;

  if v_clean ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Display name cannot be an email';
  end if;

  insert into public.profiles (
    id,
    nome,
    apelido_publico,
    display_name,
    is_admin,
    current_streak,
    best_streak,
    created_at
  ) values (
    v_uid,
    v_clean,
    v_clean,
    v_clean,
    false,
    0,
    0,
    now()
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        apelido_publico = excluded.apelido_publico,
        nome = coalesce(nullif(public.profiles.nome, ''), excluded.nome);

  return v_clean;
end;
$$;

revoke all on function public.set_my_display_name(text) from public;
grant execute on function public.set_my_display_name(text) to authenticated;
