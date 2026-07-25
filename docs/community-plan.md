# Bloom Community — Design & Safety Plan (pre-build)

**Status:** proposal only. No code until the launch gate below is met.

## What this is (and isn't)

A small, warm, pseudonymous space where expecting parents trade encouragement and practical wisdom — "what helped your nausea?", "show me your nursery." It is **not** a social network, **not** a medical forum, and **not** a growth surface. Bloom's voice applies: calm, literary, no feeds engineered for compulsion.

## Launch gate

Build only when **≥500 active households** (any check-in or journal write in trailing 30 days) **and** one trained moderator is contracted. Below that, threads are empty and moderation load is disproportionate — a quiet community is worse than none.

## Anonymity model

- Display **pseudonyms** auto-assigned at first post (`WillowFox`, `AmberWren`) — re-rollable, never real names, never email-derived. No profile photos at launch (avatars from a fixed watercolor set).
- Household and partner identities are never exposed. Posts carry only pseudonym + optional pregnancy-week badge ("Week 24"), which is the useful context and nothing more.
- No DMs at launch. DMs are the highest-abuse surface in parenting communities; revisit only with blocking, rate limits, and demand.

## Proposed schema (Supabase)

```sql
create table community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  pseudonym text not null,
  category text not null,                -- 'symptoms' | 'milestones' | 'questions' | 'nursery' | 'partners'
  week_number int,                       -- optional author badge, 1..40
  body text not null check (char_length(body) <= 2000),
  loss_flag boolean not null default false,  -- set by author prompt or moderator
  hidden boolean not null default false,     -- moderator hide, no hard delete pre-appeal
  created_at timestamptz not null default now()
);

create table community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references community_posts on delete cascade not null,
  user_id uuid references auth.users not null,
  pseudonym text not null,
  body text not null check (char_length(body) <= 800),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table community_votes (           -- one gentle "me too" per user
  post_id uuid references community_posts on delete cascade,
  comment_id uuid references community_comments on delete cascade,
  user_id uuid references auth.users not null,
  check (num_nonnulls(post_id, comment_id) = 1),
  primary key (user_id, post_id, comment_id)
);

create table community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users not null,
  post_id uuid, comment_id uuid,
  reason text not null,                  -- 'harmful' | 'medical-misinfo' | 'harassment' | 'spam' | 'loss-distress'
  status text not null default 'open',   -- 'open' | 'actioned' | 'dismissed'
  created_at timestamptz not null default now(),
  check (num_nonnulls(post_id, comment_id) = 1)
);

create table community_blocks (
  blocker_id uuid references auth.users not null,
  blocked_id uuid references auth.users not null,
  primary key (blocker_id, blocked_id)
);
```

RLS: anyone in an active household reads non-hidden content; users write/delete their own; moderator role hides; blocks filter at query level (both directions). All tables keyed to `auth.users`, never to household — community membership is per person.

## App Store guideline 1.2 (UGC) — compliance checklist

1. **Report**: flag on every post and comment; reports create a moderation queue entry (schema above).
2. **Block**: block from any profile/post; blocked users' content disappears both directions, immediately.
3. **Filter**: pre-publish keyword classifier for slurs, threats, and known medical-misinformation phrases; auto-hold (not auto-publish) on hit.
4. **Published rules**: "The gentle rules" — one screen, plain language, shown before first post and linked in Settings: be kind, no medical advice (share experience, defer to providers), no selling, no real names or identifying photos, loss is spoken of gently.
5. **Contact**: `support@` address + in-app "Talk to a human" on the rules screen; Apple requires a way to reach the developer about objectionable content.
6. **EULA/ToS**: community use covered in Terms, with content-removal and account-suspension rights stated.

## Moderation policy (draft)

- **Response targets:** reports triaged <24h; content credibly threatening self-harm or a minor <1h, with emergency-resource reply and escalation playbook.
- **Medical misinformation** (e.g., "skip your prenatals," "castor oil at 30 weeks"): hide + reply linking the relevant Learn article. Repeat offenders: posting pause, then suspension.
- **Pregnancy-loss sensitivity — special handling:**
  - Support resources (e.g., national loss-support organizations) are **pinned** at the top of any loss-flagged thread and of a permanent "Grief is welcome here" space.
  - **No algorithmic amplification of loss content**: loss-flagged posts are excluded from any "trending"/most-voted surface and from push notifications, except a direct reply to the author. Ranking by votes applies only to non-loss categories.
  - Loss threads are **moderated proactively**, not just on report; a **trained moderator** (perinatal-bereavement-aware, e.g., trained via an established pregnancy-loss charity program) is a hard launch requirement, not a nice-to-have.
  - Announcements of new pregnancies are welcome but never auto-cross-posted into loss spaces; week badges are hidden in loss-flagged threads.
- **Moderator tooling**: hide/unhide, pseudonym-level posting pause, suspension, audit log of every action.

## Open questions before build

- Comment threading depth (propose flat; simpler to moderate).
- Whether partners get the same space or a parallel one (propose same; categories separate context).
- Localization of the keyword filter before any non-English launch.
