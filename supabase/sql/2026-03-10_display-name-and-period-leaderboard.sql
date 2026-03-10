-- Minimal and non-destructive setup for:
-- 1) public display names (no personal email exposure)
-- 2) period-aware leaderboard RPC with real totals

-- 1) Add display_name column (idempotent)
alter table if exists public.profiles
  add column if not exists display_name text;

comment on column public.profiles.display_name is
  'Public name shown in leaderboard UI. Must not be an email.';

-- 2) Backfill display_name from apelido_publico when safe (never from email-like values)
update public.profiles
set display_name = trim(apelido_publico)
where coalesce(trim(display_name), '') = ''
  and coalesce(trim(apelido_publico), '') <> ''
  and trim(apelido_publico) !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$';

-- 3) Allow authenticated users to update only their own profile row
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_update_own_public_name'
  ) then
    create policy profiles_update_own_public_name
      on public.profiles
      for update
      to authenticated
      using (id = auth.uid())
      with check (id = auth.uid());
  end if;
end $$;

-- 4) RPC for user to set display name safely
create or replace function public.set_my_display_name(p_display_name text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clean text;
begin
  if auth.uid() is null then
    raise exception 'User not authenticated';
  end if;

  v_clean := btrim(coalesce(p_display_name, ''));

  if length(v_clean) < 3 then
    raise exception 'Display name must have at least 3 characters';
  end if;

  if length(v_clean) > 24 then
    raise exception 'Display name must have at most 24 characters';
  end if;

  if v_clean ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Display name cannot be an email';
  end if;

  update public.profiles
  set display_name = v_clean,
      apelido_publico = v_clean
  where id = auth.uid();

  if not found then
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
      auth.uid(),
      v_clean,
      v_clean,
      v_clean,
      false,
      0,
      0,
      now()
    );
  end if;

  return v_clean;
end;
$$;

revoke all on function public.set_my_display_name(text) from public;
grant execute on function public.set_my_display_name(text) to authenticated;

-- 5) Period-aware leaderboard RPC with real totals from daily_logs
create or replace function public.get_leaderboard_by_period(p_period text default 'week')
returns table (
  user_id uuid,
  display_name text,
  streak int,
  questoes bigint,
  flashcards bigint,
  total_minutes bigint,
  minutos_revisao bigint
)
language sql
security definer
set search_path = public
as $$
with normalized_period as (
  select case lower(coalesce(p_period, 'week'))
    when 'today' then 'today'
    when 'hoje' then 'today'
    when 'week' then 'week'
    when 'semana' then 'week'
    when 'month' then 'month'
    when 'mes' then 'month'
    when 'mês' then 'month'
    when 'all' then 'all'
    when 'geral' then 'all'
    else 'week'
  end as period
),
bounds as (
  select
    current_date as end_date,
    case period
      when 'today' then current_date
      when 'week' then current_date - 6
      when 'month' then current_date - 29
      when 'all' then null::date
    end as start_date
  from normalized_period
)
select
  dl.user_id,
  coalesce(
    nullif(
      case
        when p.display_name is not null
          and trim(p.display_name) <> ''
          and p.display_name !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
        then trim(p.display_name)
      end,
      ''
    ),
    nullif(
      case
        when p.apelido_publico is not null
          and trim(p.apelido_publico) <> ''
          and p.apelido_publico !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
        then trim(p.apelido_publico)
      end,
      ''
    ),
    'Aluno ' || upper(substring(dl.user_id::text, 1, 4))
  ) as display_name,
  coalesce(p.current_streak, 0)::int as streak,
  coalesce(sum(dl.questoes), 0)::bigint as questoes,
  coalesce(sum(dl.flashcards), 0)::bigint as flashcards,
  coalesce(sum(dl.tempo_estudo), 0)::bigint as total_minutes,
  coalesce(sum(dl.minutos_revisao), 0)::bigint as minutos_revisao
from public.daily_logs dl
join bounds b on true
left join public.profiles p on p.id = dl.user_id
where (b.start_date is null or dl.date >= b.start_date)
  and dl.date <= b.end_date
group by dl.user_id, p.display_name, p.apelido_publico, p.current_streak
having
  coalesce(sum(dl.questoes), 0) > 0
  or coalesce(sum(dl.flashcards), 0) > 0
  or coalesce(sum(dl.tempo_estudo), 0) > 0
  or coalesce(sum(dl.minutos_revisao), 0) > 0
order by questoes desc, flashcards desc, total_minutes desc;
$$;

revoke all on function public.get_leaderboard_by_period(text) from public;
grant execute on function public.get_leaderboard_by_period(text) to authenticated, anon;
