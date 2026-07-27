# Bloom — Project State & Handoff
**Last updated: 2026-07-26 (after build 5 preview installed and booting on Luis's iPhone)**
**Read this first. It is the complete memory of the Bloom project chats.**

---

## 1. TL;DR — where things stand

- **Bloom** (pregnancy companion for two, iOS-first, Expo SDK 54 + RN 0.81 new architecture) lives at **github.com/wpbluiss/bloom-app**, bundle `com.wpluiss.bloom`, ASC App ID **6794489325**.
- **Waves 2 and 3 are fully shipped on `main`** (splash, settings accordion, mood-aware check-in, paywall redesign + exit offer, Learn story player, journal book redesign + gender theming, media compression, Apple sign-in plumbing).
- **Build 5 finally boots** after a 3-round startup-crash saga (root cause documented in §6). Luis installed the `preview` (internal-distribution) build via QR because **TestFlight installs are failing Apple-wide right now** (developer-forums wave, not our build).
- **Build 4 remains untouched in Apple Review.**
- Luis's verdict after using it (2026-07-26): **functional but below his design bar.** His exact complaints are the next session's work order — see §7.
- Luis's Kimi quota is ~93% spent, resets **2026-08-23**. Keep sessions surgical. This document exists so a fresh chat starts with zero re-explanation.

---

## 2. Accounts, IDs, keys (not secrets — app-side public keys)

| Thing | Value |
|---|---|
| GitHub repo | `wpbluiss/bloom-app` (main branch, direct commits) |
| Bundle ID | `com.wpluiss.bloom` |
| App Store Connect App ID | `6794489325` |
| Apple Team ID | `X55X7W4V2B` |
| ASC email | `wpluisbusiness@gmail.com` |
| EAS project ID | `4be81ef5-1d17-4521-9608-a0981c25adb9` (owner `wpbluiss`) |
| Supabase project ref | `olqryrntsxglehxyahzf` (URL `https://olqryrntsxglehxyahzf.supabase.co`) |
| Supabase publishable key | `sb_publishable_FLh8kwTvhGMrZXNQxladxw_HX6yP6Rf` (in app.json → extra) |
| RevenueCat public SDK key | `appl_PQKDAxabEBYSaLQrYsyDvCGoiyg` (in app.json → extra) |
| Products (RevenueCat) | Pregnancy Pass one-time `bloom_pregnancy_pass_v1`; optional launch SKU `bloom_pregnancy_pass_launch_v1` (**Luis still needs to create this in ASC + RC**); Bloom+ monthly/yearly; +Moment pack |
| Legal URLs | `https://bloom.conduitai.io/terms.html`, `/privacy.html` |
| DB migrations applied | through 006 + **`add_baby_sex_to_pregnancies`** (2026-07-26: `pregnancies.baby_sex text null check in ('boy','girl')`) |

---

## 3. How work gets done here (operational playbook)

**Luis's machine:** older iMac (macOS without `log stream --device`), ~2 GB free disk (chronic — Downloads held 14 GB; clean with DerivedData/DeviceSupport/Caches/Trash wipes). iPhone 17 Pro Max, **iOS 26.6**, Developer Mode ON. `brew` + `libimobiledevice` installed 2026-07-26.

**Push pipeline (no git credentials in the agent sandbox):**
1. Agent edits a pristine tarball of `main` locally, runs `npx tsc --noEmit` (must be 0 errors — the "pristine gate").
2. Agent pushes full file contents via GitHub MCP `push_files` (owner `wpbluiss`, repo `bloom-app`, branch `main`).
3. **Mandatory verify:** fetch `raw.githubusercontent.com/.../{sha}/{path}` and `diff` against local. Sync any drift.
4. **Never transcribe large files from memory** — re-read from disk immediately before assembling a paste (two stale-read incidents happened; both caught by the diff rule).
5. `package-lock.json` is too big for MCP — Luis regenerates locally: `npm install && git add package-lock.json && git commit && git push`.

**Build pipeline (Luis runs):**
```
cd ~/bloom-app && git pull && npx eas build --platform ios --profile preview   # ad-hoc, installs via QR on registered devices
cd ~/bloom-app && git pull && npx eas build --platform ios --profile production --auto-submit   # TestFlight/ASC
```
- eas.json profiles: `development` (dev client), `preview` (internal distribution, real devices — **the TestFlight-bypass lane used tonight**), `production` (store + auto-submit to ASC 6794489325).
- Ad-hoc builds require **Developer Mode ON** on the device (Settings → Privacy & Security → Developer Mode).
- Bump `ios.buildNumber` in app.json per production build (currently **"5"**).

**Crash forensics on the iPhone (works on old macOS):**
```
mkdir -p ~/Desktop/crashlogs && idevicecrashreport -e -k ~/Desktop/crashlogs   # pulls .ips files
# newest faulting-thread stack with library names:
python3 -c "
import json,glob
f=sorted(glob.glob('/Users/luisdaniel/Desktop/crashlogs/Bloom-*.ips'))[-1]
txt=open(f).read()
p=json.loads(txt[txt.index(chr(10))+1:])
imgs=p['usedImages']; t=p['threads'][p['faultingThread']]
print('queue:', t.get('queue','(none)'))
[print(fr.get('symbol','+0x%x'%fr['imageOffset']),' <== ',imgs[fr['imageIndex']].get('name') or imgs[fr['imageIndex']].get('path','?')) for fr in t.get('frames',[])[:22]]
"
```
(`idevicesyslog` streams device logs but release builds log almost nothing; the .ips pull is the reliable one. devicectl's device ID ≠ libimobiledevice UDID — use `idevice_id -l`.)

**Agent sandbox gotchas:** `/tmp` wipes between cells — re-download `https://codeload.github.com/wpbluiss/bloom-app/tar.gz/main` and `npm install` before editing. Sandbox has no git push creds; MCP is the only write path.

---

## 4. Architecture map

- **Stack:** Expo SDK 54, RN 0.81 (**newArchEnabled: true**), expo-router v6, TypeScript, Supabase (auth/db/storage/edge functions), RevenueCat (react-native-purchases v9), React Navigation v7, react-native-svg, RN Animated (no Reanimated-based custom anims written by us; reanimated 4.1 + worklets are deps of the stack).
- **app.config.js** wraps app.json (adds `expo-apple-authentication` plugin + `usesAppleSignIn`; Google sign-in was REMOVED 2026-07-26 — see §6).
- **Key dirs:** `app/(tabs)/` index(home+check-in), journal, learn, wishlist, foods; `app/(auth)/login.tsx`; `app/(onboarding)/`; `app/settings.tsx` (accordion); `app/paywall.tsx`; `app/learn/[id].tsx` (story player); `app/journal/compose.tsx`, `app/journal/player.tsx`; `app/wishlist/[id].tsx`.
- **lib/:** `db.ts` (all Supabase access + Apple sign-in), `theme.ts` (design tokens + `genderAccent()`), `copy.ts` (ALL user-facing strings — edit copy here), `events.ts` (analytics; add new events to the `BloomEvent` union), `revenuecat.ts`, `entitlements.tsx`, `media.ts` (long-edge 1920 compression, fail-safe), `notifications.ts`, `articles.ts` (Learn content + `heroWeekFor`), `AppContext.tsx`, `errorReporting.ts`, `weeks.ts`.
- **components/:** IntroSplash (rewritten 2026-07-26, native-driver-only), Button, Card, Chip, EmptyState, FadeIn, PressScale, ErrorBoundary, InviteCard, Skeleton.
- **Design tokens:** Fraunces serif (display) + Inter (body); warm cream canvas `#FAF6F0`, paper `#FDF9F3`, terracotta `#C4603C`; gender accents in `theme.ts`: boy `#5B84A8`, girl `#C97B92`, cream/terracotta until `pregnancies.baby_sex` set (Settings → Pregnancy → Baby chips).

---

## 5. Shipped feature log (with commit SHAs)

**Wave 2 (2026-07-25/26):** IntroSplash seed→bloom `651c111`; BloomNavTheme gray-modal fix + revenuecat launch-SKU plumbing `cd7bd5b`; settings accordion + email Verified badge `ded055e`; mood-aware check-in symptoms `7bc4308`; paywall comparison table + BEST VALUE + once-ever exit offer `7f7c4bd`; copy.ts hotfix `4e01578`.
**Wave 3:** Learn story rings + `learn_complete` event `43fd308`; article hero rules `7a86f62`; IG-style story player `21a352b`; media compression hardening `6ba2e53`; journal book redesign + gender theming `dd15662`+`619121d`+`c5d52b5`; Apple/Google sign-in `5b2dabe`+`35819c9` (Google later removed); buildNumber 5 `81c8ee6`; encryption flag `03ebc29`.
**Crash fixes:** google strip `faf3c17`+`959c2ad`; Apple-flag gate `50e9a60`; **splash root-cause fix `1327e9d`** (app boots after this).

---

## 6. The build-5 startup-crash saga (so nobody re-learns this the hard way)

**Symptom:** every build aborted ~0.9s after launch, mid-splash, on device only (release builds; never in typecheck). Crash reports: `EXC_CRASH (SIGABRT)`, faulting thread `com.meta.react.turbomodulemanager.queue`, stack = ObjC exception inside `ObjCTurboModule::performVoidMethodInvocation`.

**Root cause (final): `components/IntroSplash.tsx`** mixed a JS-driven animation (`useNativeDriver: false` animating SVG `strokeDashoffset` via `Animated.createAnimatedComponent(Path)`) with a native-driven value inside `Animated.multiply(seed, stem.interpolate(...))`. The new architecture's native animated module cannot compose across drivers, and the invalid native prop path aborted the process. Repo-wide grep confirmed it was the ONLY site with either pattern. Fixed by rewriting the splash to **native-driver + opacity/transform only** (`1327e9d`) — the four-beat seed→shake→sprout→bloom story is preserved visually.

**Red herrings chased (correct decisions, wrong culprit):** (1) `@react-native-google-signin/google-signin` removed (was dormant/unconfigured; its `useFrameworks: static` requirement via `expo-build-properties` was also stripped — linkage back to build-4-proven). Google sign-in returns ONLY with real OAuth keys (see app.config.js comment). (2) `appleSignInAvailable()` startup call removed; Apple button now gated behind `extra.appleSignInEnabled: false` in app.json — flip to `true` only after enabling the Apple provider in Supabase AND verifying the tap on a test build.

**Also happening that night:** TestFlight installs failing Apple-wide ("TestFlight is currently unavailable" on two devices; developer-forums wave; status page lagging). The `preview` profile + QR install + Developer Mode is the reliable bypass.

---

## 7. NEXT SESSION'S WORK ORDER — Luis's feedback, 2026-07-26 (verbatim intent, translated to tasks)

Luis: *"It's not meeting the standard I'm reaching for."* Fix these, in his priority order:

1. **Learn "stories" are just text — "kills the whole idea."** He expected Instagram-style VISUAL stories (photos/illustrations per card, maybe video), not text cards. Current: `app/learn/[id].tsx` renders text cards + one hero illustration on the cover. **Task:** give every story card real artwork — generate per-topic illustrations (there are existing week illustrations in assets to match style with) and render image-forward cards (image dominant, short caption), or source real imagery. This is THE flagship fix.
2. **Learn section layout is shifted left, not centered** (`app/(tabs)/learn.tsx` — likely the story-rings rail `contentContainerStyle`/alignment from `43fd308`). Repro: open Learn tab. Center the rail.
3. **Wishlist "better price" alternatives don't open links** (`app/wishlist/[id].tsx` — alternative rows show retailer/price but tapping does nothing). **Task:** `Linking.openURL(alt.url)` on tap (guard invalid URLs), maybe `expo-web-browser` in-app sheet.
4. **Splash "is not good at all."** He wanted premium (SKIMS-level) — the current SVG-shape animation reads cheap to him. **Task:** redesign for real polish (consider a generated hero image sequence or richer motion; must stay native-driver + opacity/transform ONLY — see §6).
5. **Journal "looks exactly the same / bland — supposed to look like an actual journal."** NOTE: the book redesign IS shipped but only shows with entries (empty journal = old-looking EmptyState) and gender tint only after Settings → Pregnancy → Baby pick. **Task:** verify what he saw; make the book aesthetic unmistakable even when empty (styled empty state, sample/first-entry prompt), and tell him to pick boy/girl.
6. **Home page "looks exactly the same."** Mood-aware symptom chips work (pick a mood in check-in → chips retune) but nothing else visibly changed. **Task:** ask what he expected; candidate: richer home visuals tied to week.

**Process note for next chat:** Luis is tired, non-technical-ish but terminal-capable, quota-constrained. Give exact commands, minimal round-trips, no jargon. He pastes terminal output back.

---

## 8. Pending Luis-side tasks (dashboards, no agent needed)

1. **Supabase → Authentication → Providers → Apple:** enable + Services ID → then set `appleSignInEnabled: true` in app.json and test the Apple button.
2. **Google sign-in (optional, later):** OAuth Web+iOS clients, then re-add the package per the comment in `app.config.js`.
3. **ASC + RevenueCat:** create `bloom_pregnancy_pass_launch_v1` → exit-offer card becomes a real discount.
4. **Supabase Pro ($25/mo)** when ready for bigger video uploads.
5. **Phone number verification badge** needs his Twilio keys.
6. **TestFlight**: retry when Apple's wave passes; build 4 still in review; build 5 (production) already uploaded to ASC.

---

## 9. Conventions & landmines

- **All copy lives in `lib/copy.ts`** — never hardcode strings in screens.
- **New tracked events** must be added to the `BloomEvent` union in `lib/events.ts` or tsc fails.
- **Animations:** native driver + opacity/transform ONLY (see §6). No JS-driver svg prop animation, no cross-driver `Animated.multiply/add`.
- **tsc gate before every push**; byte-verify every push; never trust memory for file contents after sandbox wipes.
- `baby_sex` drives journal theming via `genderAccent()` — cream default, blue/rose after Settings pick.
- Journal book look requires entries; Learn stories require `learn_open`/`learn_complete` analytics to guide content.
