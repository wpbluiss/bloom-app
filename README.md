# Bloom

*For the nine months that change everything.*

A warm, keepsake-grade pregnancy-journey app for iOS: weekly baby-size tracking, daily check-ins, a private shared journal, a wishlist with deal-finding, and gentle food guidance — for both parents.

## Stack

- **Expo SDK 52** (TypeScript) with `expo-router` v4 file-based routing
- **Supabase** — auth (email magic-link / OTP), Postgres tables with RLS, private Storage buckets (`journal-media`, `wishlist-photos`) rendered via signed URLs
- **Design** — Fraunces (display) + Inter (UI) via `expo-google-fonts`, warm ivory canvas `#FAF6F0`, terracotta accent, flat fills, soft warm shadows
- **Local notifications only** (`expo-notifications`) — daily evening check-in + weekly Monday rollover; no push server
- Micro-interactions with `react-native-reanimated` (press scale 0.97, staggered screen entrances)

## Setup

```bash
npm install
npx expo start
```

`npm install` also runs `scripts/decode-assets.js` (postinstall), which decodes the
committed base64 brand assets into `assets/icon.png`, `assets/adaptive-icon.png`,
and `assets/splash.png` (terracotta rounded-square with a cream serif "B").

Scan with Expo Go, or press `i` for the iOS simulator.

Supabase credentials live in `app.json → expo.extra` (publishable key is client-safe).
To override without editing the file, set env vars:

```bash
EXPO_PUBLIC_SUPABASE_URL=... EXPO_PUBLIC_SUPABASE_ANON_KEY=... npx expo start
```

## EAS Build & TestFlight (Luis's Apple Developer account)

```bash
npm install -g eas-cli
eas login                       # Luis's Expo account
eas init                        # links the project, writes projectId into app.json

# Simulator build for quick previews
eas build --profile preview --platform ios

# Production build → App Store Connect
eas build --profile production --platform ios

# Submit to TestFlight (fill in the placeholders in eas.json first:
# appleId, ascAppId, appleTeamId)
eas submit --platform ios --profile production
```

Then in App Store Connect: add the build to a TestFlight group and invite testers.

## Edge function

The wishlist "Find lookalikes & deals" button calls a Supabase Edge Function named
`find-alternatives`. The source lives at `supabase/functions/find-alternatives/index.ts`
and currently returns a graceful empty array (TODO: connect a real product-search
provider). The app handles the empty/undeployed case gracefully
("We're still finding lookalikes for this one").

Deploy it with:

```bash
supabase functions deploy find-alternatives --project-ref olqryrntsxglehxyahzf
```

## Project structure

```
app/
  _layout.tsx            root stack, fonts, auth gate provider
  index.tsx              session/household/pregnancy routing gate
  (auth)/login.tsx       email magic-link + OTP code entry
  (onboarding)/          welcome → role → due date (+ baby nickname)
  (tabs)/                Today · Journey · Journal · Wishlist · Food
  journal/compose.tsx    entry composer (types, milestone chips, photo/video attach)
  wishlist/new.tsx       add item (camera/library or manual)
  wishlist/[id].tsx      detail, status toggle, lookalikes & deals
  settings.tsx           profile, role, due date, sign out
components/              Button, Card, Chip, EmptyState, Skeleton, PressScale, FadeIn
lib/
  theme.ts               design tokens (verbatim from the design system)
  copy.ts                all UI copy (from copy.md)
  db.ts                  typed Supabase helpers
  weeks.ts               week math (week = 40 − ceil(days-to-due/7), clamped 4..40)
  media.ts               photo compression + video size warning
  notifications.ts       local-only gentle reminders
  AppContext.tsx         session/profile/household/pregnancy state
assets/                  weeks.json, foods.json, icon/splash (committed as .png.b64
                         and decoded to PNG by `npm run decode-assets`, which runs
                         automatically on postinstall)
supabase/functions/      find-alternatives edge function source
```

## Notes

- Database schema is pre-migrated (tables + RLS + buckets); the app only reads/writes rows.
- Photos are compressed (max 1600px, JPEG 70%) before upload; videos over ~50MB trigger a gentle warning.
- Typecheck: `npm run typecheck`.
- `package-lock.json` is generated on first `npm install` (commit it locally after your
  first install if you want pinned CI builds).
