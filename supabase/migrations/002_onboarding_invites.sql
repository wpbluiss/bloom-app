-- 002_onboarding_invites.sql
-- Keepsake onboarding answers + household invite codes + partner-join RPCs.
-- Safe to run on the live project; additive only, idempotent.

-- 1) profiles.onboarding_answers — the warm onboarding Q&A, stored as a JSON blob.
alter table public.profiles
  add column if not exists onboarding_answers jsonb;

-- 2) households.invite_code — a short, human-readable code ("BLOOM-42" style,
--    unambiguous alphabet: no 0/O, 1/I/L) that links a partner to a household.
alter table public.households
  add column if not exists invite_code text;

create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text := '';
  i int;
begin
  for i in 1..6 loop
    code := code || substr(alphabet, floor(random() * length(alphabet) + 1)::int, 1);
  end loop;
  return code;
end;
$$;

-- Backfill existing households (retry around the rare random collision).
do $$
declare
  h record;
begin
  for h in select id from public.households where invite_code is null loop
    loop
      begin
        update public.households
           set invite_code = public.generate_invite_code()
         where id = h.id;
        exit;
      exception when unique_violation then
        -- draw again
      end;
    end loop;
  end loop;
end $$;

-- Every new household gets a code automatically.
alter table public.households
  alter column invite_code set default public.generate_invite_code();

create unique index if not exists households_invite_code_key
  on public.households (invite_code);

-- 3) preview_household_by_code — SECURITY DEFINER so an authenticated user who
--    is NOT yet a member can confirm whose family they're joining (name only).
create or replace function public.preview_household_by_code(code text)
returns table (id uuid, name text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select h.id, h.name
      from public.households h
     where h.invite_code = upper(btrim(code))
     limit 1;
end;
$$;

-- 4) join_household_by_code — atomically moves the caller into the household
--    that owns the code. Raises 'invalid_code' when nothing matches.
create or replace function public.join_household_by_code(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select h.id into target
    from public.households h
   where h.invite_code = upper(btrim(code))
   limit 1;

  if target is null then
    raise exception 'invalid_code';
  end if;

  -- Joining means leaving any household the caller is currently in.
  delete from public.household_members where user_id = auth.uid();

  insert into public.household_members (household_id, user_id, role)
  values (
    target,
    auth.uid(),
    coalesce((select p.role from public.profiles p where p.id = auth.uid()), 'partner')
  );

  return target;
end;
$$;

-- 5) regenerate_invite_code — mint a fresh code for the caller's household
--    (Settings → "New code"). Old code stops working immediately.
create or replace function public.regenerate_invite_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  hh uuid;
  new_code text;
begin
  select household_id into hh
    from public.household_members
   where user_id = auth.uid()
   limit 1;

  if hh is null then
    raise exception 'no_household';
  end if;

  loop
    new_code := public.generate_invite_code();
    begin
      update public.households set invite_code = new_code where id = hh;
      exit;
    exception when unique_violation then
      -- draw again
    end;
  end loop;

  return new_code;
end;
$$;

grant execute on function public.preview_household_by_code(text) to authenticated;
grant execute on function public.join_household_by_code(text) to authenticated;
grant execute on function public.regenerate_invite_code() to authenticated;
