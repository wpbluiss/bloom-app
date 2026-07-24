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
