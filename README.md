# Bloom

*For the nine months that change everything.*

A warm, keepsake-grade pregnancy-journey app for iOS: weekly baby-size tracking, daily check-ins, a private shared journal, a wishlist with deal-finding, and gentle food guidance — for both parents.

## Stack

- **Expo SDK 54** (TypeScript) with `expo-router` v6 file-based routing
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
committed base64 brand assets into real PNGs:

- `assets/icon.png` — 1024×1024 app icon: a watercolor two-leaf sprout in
  terracotta/sage on ivory `#FAF6F0`
- `assets/adaptive-icon.png` — 1024×1024 Android adaptive-icon foreground
  (transparent, sprout sized for the mask; background `#FAF6F0` from `app.json`)
- `assets/splash-icon.png` — transparent sprout shown centered on the ivory splash
- `assets/favicon.png` — 48×48 web favicon

Scan with Expo Go, or press `i` for the iOS simulator.

Supabase credentials live in `app.json → expo.extra` (publishable key is client-safe).
To override without editing the file, set env vars:

```bash
EXPO_PUBLIC_SUPABASE_URL=... EXPO_PUBLIC_SUPABASE_ANON_KEY=... npx expo start
```

## Ship to TestFlight tonight (Luis's iMac)

One-time prep:

```bash
npm install -g eas-cli
git pull
npm install                 # postinstall decodes the brand PNGs from .b64 payloads
npx expo install --check    # verify all deps match Expo SDK 54
eas login                   # Luis's Expo account
eas init                    # links the project; writes the real `owner` and
                            # `extra.eas.projectId` into app.json (placeholders now —
                            # commit the result so builds are reproducible)
```

Then, **before the first submit**, create the App Store Connect app record
(needed once, `eas submit` cannot create it):

1. https://appstoreconnect.apple.com → **Apps → + → New App**
2. Platform iOS, name **Bloom**, primary language English
3. **Bundle ID: `com.wpluiss.bloom`** (must match `app.json → ios.bundleIdentifier`)
4. SKU e.g. `bloom-ios`; full access for Luis's team

Build and upload:

```bash
# Production build in the cloud (~15-25 min, profile "production" in eas.json:
# distribution "store", m-medium runner)
eas build --platform ios --profile production

# Submit straight to App Store Connect — first fill the three placeholders in
# eas.json → submit.production.ios (appleId, ascAppId, appleTeamId;
# ascAppId = the numeric App ID of the app record you just created)
eas submit --platform ios --profile production
```

(No submit credentials handy? Alternative: download the `.ipa` from the build page
and upload it with Xcode → *Window → Organizer*, or `xcrun altool --upload-app`.)

Get it to Delia:

1. App Store Connect → your app → **TestFlight**
2. Wait for the build to finish processing (~5-30 min after upload)
3. **Internal testing** (instant, no Apple review): App Store Connect →
   *Users and Access* → invite Delia's email with any role (even *Marketing*),
   then in TestFlight → *Internal Testing* create a group, add her, enable the
   build. Internal = up to 100 App Store Connect users, builds go live immediately.
4. She installs the **TestFlight** app on her iPhone, accepts the invite, and
   Bloom appears — ivory splash, sprout icon and all.

Note: **external** testers (anyone not on your App Store Connect team) require a
short Beta App Review (~24h) for the first build — internal is the fast path tonight.

## Regenerating the brand assets

The repo is kept text-only, so the four PNGs above are committed as base64 payloads
in `assets/` and rebuilt by `npm install` (postinstall → `scripts/decode-assets.js`):

- `splash-icon.png.b64`, `favicon.png.b64` — single-file payloads
- `adaptive-icon.png.b64.1 … .3` — one payload split into ordered parts
- `icon.png.b64x.1 … .11` — split payload, additionally XOR-obfuscated with a
  SHA-256 counter keystream (the key lives in `scripts/decode-assets.js`) so the
  text contains no long repeated blocks, which some text-only tooling mangles

The decoder concatenates parts, un-obfuscates `.b64x`, and verifies the PNG magic
bytes **and** IEND trailer — a truncated/corrupt payload fails the install loudly
instead of shipping a broken icon.

To swap in new artwork: drop the new PNGs in `assets/`, re-encode
(`base64 -i new.png -o assets/<name>.png.b64`, splitting into ≤ ~5 KB parts and/or
applying the `.b64x` XOR for large files), and delete the real PNGs before
committing. Then run `npm run decode-assets` and check `app.json` references.

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
assets/                  weeks.json, foods.json, content/ illustrations, plus
                         *.png.b64[.N] / *.png.b64x.N brand payloads decoded to
                         icon/adaptive-icon/splash-icon/favicon PNGs on postinstall
scripts/decode-assets.js postinstall decoder for the base64 brand assets
supabase/functions/      find-alternatives edge function source
```

## Notes

- Database schema is pre-migrated (tables + RLS + buckets); the app only reads/writes rows.
- Photos are compressed (max 1600px, JPEG 70%) before upload; videos over ~50MB trigger a gentle warning.
- Typecheck: `npm run typecheck`.
- `package-lock.json` is generated on first `npm install` (commit it locally after your
  first install if you want pinned CI builds).
