// UI copy from copy.md — Bloom brand voice
export const copy = {
  welcome: {
    wordmark: 'Bloom',
    subline: 'For the nine months that change everything.',
    primary: 'Begin',
    secondary: "We're already expecting",
  },
  dueDate: {
    eyebrow: 'WHEN IS YOUR LITTLE ONE DUE?',
    headline: "Let's count the weeks together.",
    helper: 'An estimate is perfectly fine — your provider can refine it later.',
    cta: 'Continue',
    skip: "I don't know yet",
  },
  role: {
    eyebrow: 'WHO ARE YOU IN THIS STORY?',
    headline: 'Bloom is for both of you.',
    cardA: { title: "I'm the mother", body: "You're carrying this little one. We'll walk each week with you." },
    cardB: { title: "I'm the partner", body: "You're in this too. We'll show you how to help, every single week." },
    cta: 'Start our journey',
    footer: 'You can switch roles or add your partner later in Settings.',
  },
  empty: {
    today: {
      headline: 'How is today treating you?',
      body: 'One small note a day becomes the story of nine months.',
      cta: 'Check in',
    },
    journey: {
      headline: 'Your timeline is waiting.',
      body: "Add your due date and we'll place you on the path, week by week.",
      cta: 'Add due date',
    },
    journal: {
      headline: "Nothing written yet — and that's okay.",
      body: 'The first entry can be one sentence. Even "we found out today" is enough.',
      cta: 'Write the first entry',
    },
    wishlist: {
      headline: 'A place for every tiny thing.',
      body: "Save the crib, the socks, the impossible-to-find swaddle. We'll help you find them for less.",
      cta: 'Add your first item',
    },
    foodSearch: {
      headline: "We don't know that one yet.",
      body: 'Try a simpler word — "cheese" instead of "triple-cream brie."',
    },
    cravings: {
      headline: 'No cravings confessed yet.',
      body: "When the pickle-and-ice-cream hour strikes, log it here — we'll suggest a kinder swap.",
      cta: 'Log a craving',
    },
  },
  checkinPrompts: [
    'How is your body feeling today?',
    'What are you most looking forward to this week?',
    'Did anything surprise you today?',
    'How did you sleep last night?',
    'What did you crave today — and did you give in?',
    'What are you a little nervous about right now?',
    'What made you smile today?',
    'If the baby could hear one thing from you today, what would it be?',
    "What's one thing your partner did that helped today?",
    'How are you really doing — honestly?',
  ],
  checkinPromptPartner9: "What's one thing you did today that helped her?",
  moods: ['Heavy', 'Tired', 'Okay', 'Good', 'Glowing'] as const,
  milestones: [
    { label: 'We found out', prompt: 'Where were you when you knew? Write down the small details.' },
    { label: 'First ultrasound', prompt: 'What did you see? What did it sound like?' },
    { label: 'Telling the family', prompt: 'Who cried? Who screamed? Who already knew?' },
    // Second-trimester bridge (E4): the beta cohort went quiet at weeks 13–16 —
    // these milestones keep the ladder warm exactly where we lost a user.
    { label: 'First flutters', prompt: 'Like bubbles, like a fish turning over — the first hello from inside. Where were you when you felt it?' },
    { label: 'The bump photo', prompt: "The first one where it really shows. Take it — you'll want proof of this exact week." },
    { label: 'First kick', prompt: 'Where were you sitting? What did it feel like — bubbles, taps, a fish turning over?' },
    { label: 'Finding out the sex', prompt: "Or choosing not to know — that's a story too." },
    { label: 'Halfway there', prompt: "Twenty weeks down, twenty to go. What do you know now that you didn't then?" },
    { label: 'The name conversation', prompt: "The serious contenders, the vetoes, the one you can't agree on." },
    { label: 'Nursery is done', prompt: "Take the photo. You'll forget how small everything started." },
    { label: 'Baby shower', prompt: 'Who came, what they gave, what they said.' },
    { label: 'Packing the hospital bag', prompt: 'What made the cut? What did you pack for the baby you\'ll meet so soon?' },
    { label: 'The last quiet weekend', prompt: 'What did you two do with the last days of just-us?' },
    { label: "Baby's here", prompt: "Everything. Write down everything. You'll want it all back someday." },
  ],
  today: {
    greeting: (name?: string | null) => {
      const h = new Date().getHours();
      const part = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
      return name ? `Good ${part}, ${name}` : `Good ${part}`;
    },
    sizeLine: (comparison: string) => `This week, your baby is the size of ${comparison}.`,
    checkinEyebrow: 'DAILY CHECK-IN',
    checkinQuestion: 'How are you feeling today?',
    dailyEyebrow: 'TODAY IN YOUR PREGNANCY',
    thisWeek: 'THIS WEEK',
    babyEyebrow: 'YOUR BABY',
    forYou: 'FOR YOU',
    forHer: 'FOR HER',
    forPartner: 'FOR YOUR PARTNER',
    // Week strip + day card
    weekStripEyebrow: 'YOUR WEEK, DAY BY DAY',
    weekDayLine: (week: number, day: number) => `Week ${week}, day ${day}`,
    beforeWindow: 'A quiet day just before this story begins — the counting starts soon.',
    afterWindow: 'Past the due date now — any day could be the day. Keep your provider close.',
    // "Today, for you" insights block
    forYouEyebrow: 'TODAY, FOR YOU',
    dayLine: (n: number) => `Day ${n} of your pregnancy`,
    expectEyebrow: 'WHAT TODAY MAY HOLD',
    commonEyebrow: 'COMMON AROUND NOW',
    commonAroundNow: [
      'Nausea, deep tiredness, and tender breasts are the usual companions of these weeks — for most, they soften after week 12.',
      'Energy often returns now, and the first flutters may follow soon. Round-ligament tugs and a growing bump become the new normal.',
      'Braxton Hicks practice contractions, heartburn, and lighter sleep are common as your body readies itself for the big day.',
    ],
    dayClose: "That's today — kept safe. See you tomorrow.",
  },
  compose: {
    typeLabels: { note: 'Quick note', milestone: 'Milestone', craving: 'Craving', ultrasound: 'Ultrasound' } as const,
    quickPicksEyebrow: {
      milestone: 'MILESTONES — TAP TO START',
      craving: 'USUAL SUSPECTS',
      ultrasound: 'WHICH SCAN?',
    } as const,
    cravingPicks: [
      'Pickles',
      'Ice cream',
      'Citrus',
      'Chocolate',
      'Something spicy',
      'Sour candy',
      'Salty fries',
      'Fresh fruit',
      'Cheese',
      'Buttered toast',
      'A milkshake',
      'Peanut butter on everything',
    ],
    ultrasoundPicks: ['Dating scan', 'Nuchal scan', 'Anatomy scan', 'Growth scan'],
    ultrasoundPhotoCta: 'Add the scan photo — it belongs right at the top.',
  },
  food: {
    segments: ['Eat well', 'Be careful', 'Cravings'] as const,
    searchPlaceholder: 'Search a food — salmon, brie, coffee…',
    benefitLine: (benefit: string) => `Supports ${benefit}`,
    doubt: 'When in doubt, ask your provider.',
    cravingPlaceholder: "I'm craving…",
    swapTitle: (craving: string) => `Craving ${craving}?`,
    swapTry: (swap: string) => `Try ${swap}`,
    disclaimer: 'Everyday guidance, not medical advice. Your provider knows you best.',
  },
  global: {
    keep: 'Keep',
    keepMemory: 'Keep this memory',
    deleteConfirm: 'Let this one go?',
    keepIt: 'Keep it',
    letItGo: 'Let it go',
    offline: "You're offline — everything is saved here, safe and sound.",
    error: "Something didn't take. Try once more?",
    signOut: 'Sign out',
    signOutConfirm: 'Your memories stay on this device.',
    weekCounter: (n: number) => `Week ${n} of 40`,
    findingAlternatives: "We're still finding lookalikes for this one",
  },
  notifications: {
    weeklyTitle: (n: number) => `Week ${n} has begun`,
    weeklyBody: (comparison: string) => `Your baby is now the size of ${comparison}. See what's growing this week.`,
    dailyTitle: 'A minute for the two of you',
    dailyBody: 'How was today? One sentence is enough.',
    // The Chloe-window rescue: fires only after three days without an open.
    rescueTitle: 'Whenever you’re ready',
    rescueBody: 'Everything is kept safe — your week will be right here when you are.',
  },
  onboarding: {
    join: {
      eyebrow: 'TWO HEARTS, ONE STORY',
      headline: 'Is your partner already on Bloom?',
      cardA: { title: 'Start fresh together', body: "We'll create a quiet, beautiful space for your growing family." },
      cardB: { title: 'Join my partner', body: 'They have a six-letter code — it links your two phones into one story.' },
    },
    code: {
      eyebrow: 'YOUR INVITATION',
      headline: 'Enter their Bloom code.',
      helper: 'Six letters and numbers, waiting on their Today screen.',
      placeholder: 'K7M2QP',
      find: 'Find their Bloom',
      join: (name: string) => `Join ${name}`,
      notFound: "That code doesn't match a family yet — worth one more look?",
      switchTitle: 'Join their family instead?',
      switchBody: "You'll leave your current Bloom space and step into theirs. Nothing they've saved changes.",
      switchConfirm: 'Yes, join them',
    },
    dueDate: {
      lmpLabel: 'First day of your last period (optional)',
      lmpHelper: 'It helps us double-check the estimate — completely optional.',
      lmpSkip: "I'm not sure",
      lmpAdd: 'I know the date',
    },
    firstBaby: {
      eyebrow: 'A LITTLE ABOUT YOU',
      headline: 'Is this your first baby?',
      options: ['Yes, our first', "We've done this before", 'Prefer not to say'],
    },
    vitamins: {
      eyebrow: 'THE DAILY RITUALS',
      headline: 'Have you started prenatal vitamins?',
      options: ['Yes, every day', 'Not yet', 'My doctor recommended different ones'],
      notYetNote: 'No pressure — many start this week. Your provider can point you to one that sits well.',
    },
    appointment: {
      eyebrow: 'FIRST HELLOS',
      headline: 'Is your first prenatal appointment scheduled?',
      notYet: 'Not yet',
      notYetTip: 'Most providers like a first visit around weeks 8 to 10 — a quick call today puts it on the calendar.',
      scheduled: 'We have a date',
    },
    feelings: {
      eyebrow: 'LATELY',
      headline: 'How have you been feeling?',
      helper: 'Choose as many as ring true. This stays between the two of you.',
      options: ['Nauseous', 'Tired', 'Tender', 'Emotional', 'Hungry', 'Queasy at smells', 'Hopeful', 'Calm', 'Anxious', 'Glowing'],
      skip: 'Skip for now',
    },
    nickname: {
      eyebrow: 'ALMOST THERE',
      headline: 'Does the little one have a nickname yet?',
      helper: '“Little Bean”, “Peanut”, “Bub” — whatever you whisper to the belly.',
      placeholder: 'Little Bean',
      skip: 'Not yet',
    },
    support: {
      eyebrow: 'YOUR PART IN THIS',
      headline: 'Here is how you show up this week.',
      footer: 'A new way to help arrives every week.',
    },
    notifications: {
      eyebrow: 'A GENTLE NUDGE',
      headline: 'May we whisper once a day?',
      body: 'One soft reminder in the evening to check in — and a small celebration each time a new week begins. Never noise.',
      timeLabel: 'DAILY REMINDER TIME',
      enable: 'Turn on gentle reminders',
      later: 'Not now',
      denied: 'No problem — you can turn this on any time in Settings.',
    },
  },
  invite: {
    eyebrow: 'SHARE BLOOM',
    headline: 'Invite your partner',
    body: 'Bloom is better together. Share this code and their phone becomes part of the same story.',
    codeLabel: 'YOUR FAMILY CODE',
    share: 'Share the code',
    regenerate: 'New code',
    shareMessage: (code: string) =>
      `Come join me on Bloom — the little app following our pregnancy week by week. Our family code is ${code}.`,
  },
  weekUnlock: {
    eyebrow: 'A NEW WEEK',
    title: (n: number) => `Welcome to week ${n}`,
    cta: (n: number) => `Begin week ${n}`,
  },
  moment: {
    take: 'Take a photo',
    choose: 'Choose from library',
    title: 'Keep this moment',
    cancel: 'Not now',
    saved: 'Kept in your journal — words can come later.',
  },
  pingpong: {
    eyebrow: 'FOR YOU BOTH',
    mood: (name: string, mood: string) => `${name} checked in feeling ${mood.toLowerCase()} today.`,
    craving: (name: string, food: string) => `${name} logged a craving: ${food}. Maybe grab some on the way home?`,
    journal: (name: string, snippet: string) => `${name} wrote in your journal: “${snippet}”`,
    partnerFallback: 'Your partner',
  },
  namePrompt: {
    body: 'What should we call you? Add your name so Bloom can greet you properly.',
    cta: 'Add my name',
  },
  checkin: {
    heardFallback: 'Thank you for checking in — every small note becomes part of the story.',
    reliefEyebrow: 'A LITTLE RELIEF',
    careLine: "If anything feels severe or scary, call your provider — that's what they're there for.",
    edit: 'Edit',
    cancel: 'Cancel',
  },
  learn: {
    title: 'Learn',
    subtitle: 'Quiet, plain-language guides — every one grounded in published guidance from trusted health institutions.',
    mostRead: 'MOST READ',
    byline: (source: string) => `Based on guidance from ${source}`,
    readSource: (source: string) => `Read the original guidance from ${source}`,
    disclaimer: 'Everyday guidance, not medical advice. Your provider knows you and your pregnancy best.',
    close: 'Close',
  },
  settings: {
    sectionProfile: 'PROFILE',
    sectionPregnancy: 'PREGNANCY',
    sectionReminders: 'REMINDERS',
    sectionPass: 'BLOOM PASS',
    sectionPartner: 'PARTNER',
    sectionAbout: 'ABOUT',
    sectionDanger: 'DANGER ZONE',
    avatarTitle: 'Your photo',
    takePhoto: 'Take a photo',
    choosePhoto: 'Choose from library',
    useIcon: 'Choose an icon instead',
    removePhoto: 'Remove photo',
    emailLabel: 'EMAIL',
    phoneLabel: 'PHONE (OPTIONAL)',
    phonePlaceholder: 'Stays private — only you see this',
    aboutPrivacy: 'Privacy Policy',
    aboutTerms: 'Terms of Use',
    versionLabel: (v: string) => `Bloom ${v}`,
    pregnancyEnded: 'This pregnancy has ended',
    deleteAccount: 'Delete my account',
    deleteHint: 'Removes your account and everything you authored. Cannot be undone.',
  },
  wishlist: {
    viewDeal: 'View deal',
  },
  review: {
    promptTitle: 'Enjoying Bloom?',
    promptBody: 'A few kind words on the App Store help another family find these nine months.',
    promptConfirm: 'Leave a review',
    promptLater: 'Not now',
  },
  danger: {
    deleteConfirmTitle: 'Delete your account?',
    deleteConfirmBody:
      'This permanently removes your account and everything you wrote, saved, and checked in. Shared memories stay with your partner. This cannot be undone.',
    deleteFinalBody: 'This is forever. The moment you confirm, your account, your words, and your saves are gone.',
    deleteConfirmConfirm: 'Delete forever',
    pregnancyEndedTitle: 'We are so sorry',
    pregnancyEndedBody:
      'However it ended, we are sorry. Closing this pregnancy ends the weekly journey here — anything you wrote stays private on this device for as long as you keep Bloom. Take all the time you need.',
    pregnancyEndedConfirm: 'Close this pregnancy',
  },
  paywall: {
    eyebrow: 'BLOOM PREGNANCY PASS',
    headline: 'One payment. Your whole pregnancy. For both of you.',
    subline: 'The week tracker, daily check-ins, food guide, and daily card you already love stay free — always. The Pass is for the memories you’ll want to keep forever.',
    bullets: [
      { icon: 'people-outline', text: 'Invite your partner into one shared Bloom — the same story on both phones.' },
      { icon: 'images-outline', text: 'Unlimited photos and videos in your journal (free holds 25).' },
      { icon: 'sparkles-outline', text: 'Unlimited one-tap Moments (free keeps 10 a month).' },
      { icon: 'book-outline', text: 'The memory book — your pregnancy as a beautiful export, the day it ships.' },
      { icon: 'infinite-outline', text: 'Every future Pregnancy Pass feature, included.' },
    ] as const,
    passCta: (price: string) => `Get the Pregnancy Pass · ${price}`,
    passCaption: 'One-time purchase. Yours for this pregnancy and every one after.',
    passActive: 'Your Pregnancy Pass is active',
    passActiveBody: 'Thank you. Everything above is yours — go make some memories.',
    plusEyebrow: 'OPTIONAL · AFTER BABY ARRIVES',
    plusTitle: 'Bloom Plus',
    plusBody: 'Extended cloud backup, postpartum mode when it ships, and future keepsake features. 7-day free trial.',
    plusCta: (price: string) => `Start Bloom Plus · ${price}/month`,
    plusActive: 'Bloom Plus is active',
    restore: 'Restore purchases',
    restoreNone: 'No previous purchases were found for this Apple ID.',
    restoreDone: 'Your purchases are restored. Welcome back.',
    welcome: 'Welcome to the Pregnancy Pass',
    welcomeBody: 'Everything is unlocked — invite your partner and start saving every moment.',
    maybeLater: 'Maybe later',
    terms: 'Terms of Use (EULA)',
    privacy: 'Privacy Policy',
    devNote: 'Purchases are not configured in this build, so everything is unlocked.',
    gatePartner: {
      title: 'Bloom is better together',
      body: 'Inviting your partner is part of the Pregnancy Pass — one payment for your whole pregnancy, covering both phones.',
    },
    gateMedia: {
      title: 'Your journal is filling up beautifully',
      body: 'The free journal holds 25 photos and videos. The Pregnancy Pass makes it unlimited — every ultrasound, every bump, every first.',
    },
    gateMoment: {
      title: 'Ten little moments kept this month',
      body: 'That’s the free monthly limit for one-tap Moments. The Pregnancy Pass lets you keep every single one.',
    },
    gateCta: 'See the Pregnancy Pass',
    gateDismiss: 'Not now',
  },
} as const;

/** Rotating daily prompt: deterministic by day-of-year, role-aware for #9. */
export function dailyPrompt(role: 'mother' | 'partner' | null | undefined): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  const idx = dayOfYear % copy.checkinPrompts.length;
  if (idx === 8 && role === 'partner') return copy.checkinPromptPartner9;
  return copy.checkinPrompts[idx];
}

/**
 * One warm sentence per mood (keyed by copy.moods) shown after she checks in,
 * so the response feels heard rather than confirmed.
 */
export const MOOD_ACKNOWLEDGMENTS: Record<string, string> = {
  Heavy: "That's a lot to carry. Thank you for saying it out loud — heavy days count too.",
  Tired: 'Rest is the work right now. Your body is doing far more than it lets on.',
  Okay: 'Okay is a perfectly good place to be. Steady days are quiet wins.',
  Good: 'Lovely — hold on to that. The good days are worth remembering.',
  Glowing: 'Glowing suits you. Soak it in — this is the good stuff.',
};

/**
 * Curated relief tips keyed by symptom chip label (Today screen check-in).
 * Short, standard prenatal guidance (ACOG/NHS-style) — not medical advice.
 */
export const SYMPTOM_RELIEF_TIPS: Record<string, string> = {
  Nausea:
    'Small, frequent meals and ginger tea are the first-line favorites. Vitamin B6 is the most-studied supplement — ask your provider.',
  Fatigue:
    'Rest is productive right now — your body is building a placenta. Iron-rich foods help if labs show low iron.',
  Heartburn: 'Smaller meals, and avoid lying down for an hour after eating.',
  Headache: 'Hydration first — dehydration is the most common trigger in early pregnancy.',
  Swelling: 'Elevate your legs when you can; mention sudden face or hand swelling to your provider.',
  Cramping:
    'Mild stretching sensations are normal as the uterus grows. Severe or one-sided pain deserves a call to your provider.',
  Insomnia:
    'A pillow between the knees and a cool, dark room. Screens off an hour before bed helps more than it sounds.',
  Backache: 'Watch posture when sitting, and a warm (not hot) compress on the lower back.',
};
