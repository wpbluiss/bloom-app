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
    { label: 'First kick', prompt: 'Where were you sitting? What did it feel like — bubbles, taps, a fish turning over?' },
    { label: 'Finding out the sex', prompt: "Or choosing not to know — that's a story too." },
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
    dailyEyebrow: 'TODAY IN YOUR PREGNANCY',
    thisWeek: 'THIS WEEK',
    babyEyebrow: 'YOUR BABY',
    forYou: 'FOR YOU',
    forHer: 'FOR HER',
    forPartner: 'FOR YOUR PARTNER',
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
