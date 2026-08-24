-- 001_initial_schema.sql
-- Real accounts + cross-device progress sync for Islamic Daily Quiz.
--
-- Design notes
--   * Three tables mirror the client's UserProgress shape 1:1.
--   * RLS: a user can only ever read/write their own rows (auth.uid()).
--   * unique(user_id, date) on quiz_sessions is the SERVER-side daily gate
--     backstop: one session per user per day can exist, even if a client
--     tries to replay the quiz.
--   * question_progress is the review pool: one row per seen question, with
--     the correctness of the MOST RECENT answer (matches client semantics —
--     a question leaves the review pool once answered correctly).
--   * Known MVP limitation: xp/streak live on profiles and are client-trusted.
--     A determined user could forge their own stats via the API. Harmless
--     today (no leaderboard, no monetization); harden later with a
--     security-definer RPC that recomputes xp from completed sessions.

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user, created automatically on signup
-- ---------------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  name          text not null,
  xp            integer not null default 0,
  streak        integer not null default 0,
  last_quiz_date date,
  reminder_time text not null default '08:00', -- HH:mm, user's local
  created_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles select own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles update own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles delete own"
  on public.profiles for delete
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- quiz_sessions — one row per daily quiz (full session payload as jsonb so a
-- fresh device can restore the exact session, options order included)
-- ---------------------------------------------------------------------------
create table public.quiz_sessions (
  id           text primary key, -- client id: s_<date>_<rand>
  user_id      uuid not null references auth.users (id) on delete cascade,
  date         date not null,    -- client-local quiz date
  questions    jsonb not null default '[]'::jsonb,
  answers      jsonb not null default '[]'::jsonb,
  score        integer not null default 0,
  total        integer not null default 0,
  xp_earned    integer not null default 0,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (user_id, date)         -- daily gate backstop
);

alter table public.quiz_sessions enable row level security;

create policy "sessions select own"
  on public.quiz_sessions for select
  using (auth.uid() = user_id);

create policy "sessions insert own"
  on public.quiz_sessions for insert
  with check (auth.uid() = user_id);

create policy "sessions update own"
  on public.quiz_sessions for update
  using (auth.uid() = user_id);

create policy "sessions delete own"
  on public.quiz_sessions for delete
  using (auth.uid() = user_id);

create index quiz_sessions_user_date_idx on public.quiz_sessions (user_id, date);

-- ---------------------------------------------------------------------------
-- question_progress — review pool / seen-questions ledger
-- ---------------------------------------------------------------------------
create table public.question_progress (
  user_id     uuid not null references auth.users (id) on delete cascade,
  question_id text not null,
  correct     boolean not null,
  seen_at     timestamptz not null default now(),
  primary key (user_id, question_id)
);

alter table public.question_progress enable row level security;

create policy "progress select own"
  on public.question_progress for select
  using (auth.uid() = user_id);

create policy "progress insert own"
  on public.question_progress for insert
  with check (auth.uid() = user_id);

create policy "progress update own"
  on public.question_progress for update
  using (auth.uid() = user_id);

create policy "progress delete own"
  on public.question_progress for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Auto-create the profile row on signup.
-- starting_xp / reminder_time ride along in raw_user_meta_data so the
-- onboarding "where are you starting?" selection survives.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, xp, reminder_time)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', 'User'),
    coalesce((new.raw_user_meta_data ->> 'starting_xp')::int, 0),
    coalesce(new.raw_user_meta_data ->> 'reminder_time', '08:00')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
