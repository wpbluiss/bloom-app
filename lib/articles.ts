/**
 * Bloom Learn — in-house articles, each grounded in published public guidance
 * from a real health institution (ACOG, NHS, Mayo Clinic, CDC, AAP). Every
 * article names its source and links to it; there are no invented authors,
 * no credentials, no editorial bylines. Bodies are warm, plain-language
 * summaries written for Bloom — not quotations — and each article renders a
 * "Based on guidance from {institution}" chip plus a link to the original.
 *
 * Categories are intentionally small at launch and designed to extend later
 * (second/third trimester, postpartum) without a schema change.
 */

export type ArticleCategory = "Baby's growth" | 'Your body' | 'Symptoms' | 'First trimester';

export const ARTICLE_CATEGORIES: ArticleCategory[] = [
  "Baby's growth",
  'Your body',
  'Symptoms',
  'First trimester',
];

export interface Article {
  id: string;
  title: string;
  category: ArticleCategory;
  /** Featured articles appear in the "Most read" rail. */
  featured: boolean;
  /** Institution whose public guidance the article is grounded in. */
  source: string;
  /** Link to the original public guidance. */
  sourceUrl: string;
  /** Paragraphs separated by blank lines. */
  body: string;
}

export const ARTICLES: Article[] = [
  {
    id: 'morning-sickness-relief',
    title: 'When nausea arrives — and how to soften it',
    category: 'Symptoms',
    featured: true,
    source: 'ACOG',
    sourceUrl: 'https://www.acog.org/womens-health/faqs/morning-sickness-nausea-and-vomiting-of-pregnancy',
    body: `Despite the name, "morning" sickness keeps its own hours — it can find you at noon, at midnight, or the moment you open the fridge. It usually begins before nine weeks and, for most, loosens its grip by the end of the first trimester. That is small comfort at 7 a.m., but it is true: this season almost always passes.

The most reliable tricks are the gentlest. Eat small amounts often rather than three full meals — an empty stomach is nausea's favorite accomplice. Keep plain crackers or dry toast within reach of the bed and eat a few before you sit up. Sip fluids through the day rather than gulping at mealtimes, and let someone else cook when the smell of the kitchen turns on you.

Ginger is the old remedy with real evidence behind it — tea, chews, or flat ginger ale all count. Vitamin B6 is the most-studied supplement for pregnancy nausea, and ACOG lists it, alone or combined with doxylamine (an over-the-counter antihistamine), as a first-line treatment. Ask your provider before starting either; they will tell you the dose that suits you.

Know when it has crossed a line. If you cannot keep any fluids down for a full day, your urine turns dark and scarce, you feel dizzy standing up, or your heart races, call your provider the same day. Severe nausea and vomiting — hyperemesis gravidarum — is a medical condition, not a failure of willpower, and it is treatable.

One more thing worth holding onto: ordinary morning sickness, miserable as it is, does not harm your baby. Your little one is remarkably good at taking what it needs. Your job is simply to get yourself through the day, one cracker at a time.`,
  },
  {
    id: 'first-prenatal-visit',
    title: 'Your first prenatal visit, gently explained',
    category: 'First trimester',
    featured: true,
    source: 'NHS',
    sourceUrl: 'https://www.nhs.uk/pregnancy/your-pregnancy-care/your-first-midwife-appointment/',
    body: `The first prenatal appointment — the "booking" visit, usually around weeks 8 to 10 — is the longest one you will have, and mostly it is a conversation. No need to be nervous about what's in the room: for most people, there is no internal exam at this visit at all.

Your midwife or provider will ask about your health history, past pregnancies, medications, and family history — not out of nosiness, but to tailor your care. They will estimate your due date, check your blood pressure, take blood for a few routine tests, and ask for a urine sample. You will likely hear about screening options for the weeks ahead; everything offered is a choice, and you can take time to decide.

A little preparation makes it easier. Bring a list of anything you take regularly — prescriptions, vitamins, supplements — and your questions, written down, because pregnancy brain is real and the room is distracting. No question is too small. "Is this cramp normal?" "Can I still eat sushi?" "Why am I so tired?" They have heard all of it a thousand times, with kindness.

Bring your partner if you can. It makes the due date feel real for both of you, and some questions — family history, how to help — belong to them too.

And if you feel tearful or overwhelmed in the chair, say so. This first visit is also where emotional wellbeing is meant to come up. The people in that room will walk beside you for nine months; it helps when they know the whole of you, not just the chart.`,
  },
  {
    id: 'babys-growth-weeks-4-12',
    title: 'Weeks 4–12: the quiet building season',
    category: "Baby's growth",
    featured: true,
    source: 'ACOG',
    sourceUrl: 'https://www.acog.org/womens-health/faqs/how-your-fetus-grows-during-pregnancy',
    body: `From the outside, the first trimester can look like nothing at all — no bump, no movement, just you and a secret. Inside, it is the busiest construction season of the whole pregnancy.

In weeks 4 and 5, your baby is smaller than a poppy seed, and already the neural tube — the structure that becomes the brain and spine — is folding itself into being. This is why folic acid matters most before many people even know they're pregnant. By around week 6, a tiny heart has begun to beat, flickering fast enough to see on an early ultrasound.

Weeks 7 and 8 bring arm and leg buds, the beginnings of eyes and ears, and a face slowly sketching itself in. By week 9 or 10, every major organ has at least begun to form, and the embryo graduates to a new name: a fetus. Fingers and toes separate, tiny nails appear, and the baby starts making small, uncoordinated movements you cannot yet feel.

By the end of week 12, your baby is about the size of a lime — roughly two and a half inches long — and fully formed in miniature. From here, the work shifts from building to growing.

Two gentle takeaways. First, these quiet weeks are why the early guidance — prenatal vitamins, no alcohol, no smoking — carries so much weight: the foundations are being laid right now. Second, if you feel awful while all this happens, that tracks. You are growing an entire person from scratch. Exhaustion is not weakness; it is the honest cost of remarkable work.`,
  },
  {
    id: 'when-to-call-your-provider',
    title: 'When to call your provider, day or night',
    category: 'Symptoms',
    featured: true,
    source: 'NHS',
    sourceUrl: 'https://www.nhs.uk/pregnancy/common-symptoms/vaginal-bleeding/',
    body: `Most pregnancy symptoms are ordinary — uncomfortable, strange, but ordinary. A few are not, and knowing the difference means you never have to sit at home wondering.

Call your provider or maternity unit the same day if you have any vaginal bleeding, even light spotting; severe or persistent tummy pain, especially one-sided; pain or burning when you pee, or fever with it; or vomiting that keeps you from holding down fluids. These usually turn out fine, but they always deserve a voice on the other end of the phone.

Seek urgent help — emergency services or your maternity triage line — for heavy bleeding, severe pain that stops you doing anything else, pain in the tip of your shoulder, or feeling faint, dizzy, or losing consciousness, especially alongside bleeding. In early pregnancy that combination can signal an ectopic pregnancy, and it cannot wait.

Later in pregnancy, the list changes shape: a baby whose movements slow, stop, or change pattern; a severe headache with blurred vision or seeing spots; sudden swelling of the face or hands; or intense itching on your palms or the soles of your feet. Each is a call-now symptom, not a wait-and-see one.

And here is the rule that outranks every list: if something feels wrong to you, call. You are the expert on your own body. Midwives and providers would always, always rather hear a worry that turns out to be nothing than meet a something too late. Bothering them is literally their job — and no one who calls at 2 a.m. with a scared heart has ever been a bother.`,
  },
  {
    id: 'foods-to-pause',
    title: 'Foods to pause on, and why',
    category: 'Your body',
    featured: false,
    source: 'CDC',
    sourceUrl: 'https://www.cdc.gov/listeria/prevention/index.html',
    body: `The list of "forbidden" pregnancy foods gets passed around like folklore, and it sounds harsher than it is. Almost everything comes down to one germ — listeria — which is rare but taken seriously because pregnancy lowers your defenses against it, and it can cross the placenta.

So the pause list, in plain terms: soft cheeses made from unpasteurized milk (pasteurized versions are fine — check the label); deli meats, cold cuts, and hot dogs, unless heated until steaming hot; refrigerated pâtés, meat spreads, and smoked fish (shelf-stable or cooked versions are okay); premade deli salads; raw sprouts; and melon that has been cut and left out. Undercooked meat, raw eggs, and raw fish join the list for the more familiar germs like salmonella.

Notice the pattern: it is rarely the food itself, it is how it was handled. A ham sandwich heated until steaming is a different proposition from the same one cold. Cravings for brie can be answered with a baked brie, still bubbling.

Two more honest notes. Certain large fish — shark, swordfish, king mackerel — carry too much mercury for pregnancy, while low-mercury fish like salmon are actively good for you, cooked. And alcohol has no known safe amount in pregnancy; that one is a full stop, not a pause.

If this all sounds like a lot, hold onto this: it is nine months, not forever, and the everyday foods you love — most of them — are still yours. When in doubt about something specific, ask your provider. They would rather answer the question than have you worry through dinner.`,
  },
  {
    id: 'safe-exercise',
    title: 'Moving your body, safely',
    category: 'Your body',
    featured: false,
    source: 'ACOG',
    sourceUrl: 'https://www.acog.org/womens-health/faqs/exercise-during-pregnancy',
    body: `Good news first: for most pregnancies, exercise is not just allowed — it is encouraged. ACOG suggests around 150 minutes of moderate activity a week, which sounds official until you realize it is a brisk twenty-minute walk most days.

The friendliest options: walking, swimming (the water carries the weight your back is tired of carrying), stationary cycling, prenatal yoga, and light strength work. "Moderate" has an easy test — you can still hold a conversation while doing it. If you were active before pregnancy, you can generally keep going with adjustments. If you were not, this is a fine time to start, gently.

A few things step aside for now: contact sports and anything with a real fall risk, hot yoga or hot Pilates (overheating is the concern), scuba diving, and — later in pregnancy — long stretches flat on your back, which can press on a major blood vessel.

The reasons to move are not abstract. Regular activity eases back pain, softens constipation, improves sleep, lifts mood, and lowers the risk of gestational diabetes and preeclampsia. It will not "shake" anything loose — a healthy pregnancy is well-cushioned by design.

Stop and call your provider if exercise brings vaginal bleeding, regular painful contractions, fluid leaking, dizziness, chest pain, or a headache that won't quit. And if your pregnancy has complications, your provider may tailor this advice — ask them at your next visit. Until then: lace up, go slow, and let the walk be a small daily gift to both of you.`,
  },
  {
    id: 'caffeine-real-numbers',
    title: 'Caffeine: the real numbers',
    category: 'Your body',
    featured: false,
    source: 'ACOG',
    sourceUrl: 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2010/08/moderate-caffeine-consumption-during-pregnancy',
    body: `You do not have to break up with coffee. Take a breath, read on.

ACOG's guidance is specific: moderate caffeine intake — under 200 milligrams a day — does not appear to raise the risk of miscarriage or preterm birth. That is not a vibe, it is a number, and it gives you something solid to plan around.

What does 200 mg look like in real life? Roughly two 8-ounce cups of home-brewed coffee (about 95 mg each). A cup of black tea runs about 45–50 mg, a can of cola around 35 mg, and even a square or two of dark chocolate contributes a little. The trap is café sizes: a large coffee-shop brew can hold 300 mg or more in a single cup, and energy drinks are all over the map — check labels there, or simply let them go for now.

Practical strategies that actual humans use: switch your second cup to decaf (it still has a few milligrams, but few enough), brew tea weaker, or make the afternoon ritual a rooibos or fruit tea — no sacrifice required. If you are a heavy caffeine person, taper rather than stopping overnight; withdrawal headaches are miserable and unnecessary.

One honest caveat: research continues, and some studies argue for less. But the guidance your provider works from is the 200 mg line, and it has been stable for years. So keep the morning cup. Drink it slowly, in the good chair. Nine months is long; small mercies matter.`,
  },
  {
    id: 'first-trimester-sleep',
    title: 'When sleep turns strange',
    category: 'Symptoms',
    featured: false,
    source: 'NHS',
    sourceUrl: 'https://www.nhs.uk/pregnancy/common-symptoms/tiredness/',
    body: `The exhaustion of the first twelve weeks is its own species — a tiredness that sleep only partly fixes. It is hormonal, it is normal, and it is doing something: your body is building the placenta, an entire temporary organ, on top of everything else it already does. Rest is not laziness right now; it is the other half of the work.

So take the nap, early in the day where you can. Accept help without a speech about deserving it. Eat decently and keep iron-rich foods in the rotation — deep, unshakeable tiredness is worth mentioning at your next appointment, since iron levels are easy to check.

Then there is the strangeness. Vivid, theatrical dreams — about the baby, about birth, about nothing at all — are a well-known pregnancy companion. They are not omens. Talking about the unsettling ones with your partner or midwife takes most of their power away.

Later, when the bump dictates the geometry: the safest position to fall asleep in is on your side, either side, and after 28 weeks it matters more — research links back-sleeping late in pregnancy with increased risk, so side it is. Do not panic if you wake on your back; just roll over and drift off again. A pillow between the knees and one under the bump turns the bed back into a friendly place.

And if tiredness arrives hand-in-hand with a low mood that won't lift — tell your midwife. That combination is common, it is not your fault, and it responds well to support.`,
  },
  {
    id: 'prenatal-vitamins',
    title: 'Prenatal vitamins: what actually matters',
    category: 'First trimester',
    featured: false,
    source: 'CDC',
    sourceUrl: 'https://www.cdc.gov/folic-acid/about/intake-and-sources.html',
    body: `The supplement aisle is a wall of promises, but the science of prenatal vitamins is refreshingly short. One nutrient does most of the heavy lifting: folic acid.

CDC recommends 400 micrograms of folic acid daily for everyone who could become pregnant, because it is the one form of folate proven to help prevent neural tube defects — serious conditions of the brain and spine that develop in the very first weeks, often before a pregnancy is even discovered. That is why the advice starts "before," and why the first trimester matters most. (If a previous pregnancy was affected by a neural tube defect, your provider may recommend a higher dose — that conversation is theirs to guide.)

Beyond folic acid, most prenatal vitamins bundle a sensible supporting cast: vitamin D, iron, iodine, and calcium. You do not need the premium bottle with the watercolor label; you need one with the right amounts, taken most days. If the pills make you queasy — a common complaint — take them with food or before bed, switch to a gummy or chewable, and mention it to your provider. Consistency beats brand loyalty.

Two cautions worth keeping. More is not better: extra vitamin A in its retinol form can actually harm a developing baby, so avoid doubling up supplements. And food still matters — fortified cereals, leafy greens, and beans all carry folate; the vitamin is a safety net, not a substitute for eating.

One small capsule a day. That is the whole ritual — and it quietly does more for your baby's first weeks than almost anything else on your list.`,
  },
  {
    id: 'early-pregnancy-anxiety',
    title: 'A worried mind is a normal one',
    category: 'Your body',
    featured: false,
    source: 'NHS',
    sourceUrl: 'https://www.nhs.uk/pregnancy/keeping-well/mental-health',
    body: `Nobody warns you that early pregnancy can feel like holding your breath for twelve weeks. Is the nausea normal? Was that cramp okay? Is there really a heartbeat in there? If your mind has been churning, hear this plainly: anxiety in early pregnancy is one of the most common experiences there is. Around one in five women deal with anxiety or low mood during pregnancy. You are in vast, quiet company.

Some worry is simply the size of the love arriving early. Hormones amplify everything, and the first trimester asks you to wait — for appointments, for scans, for certainty — which is hard work for any brain. Normal worry comes and goes and leaves room for ordinary life.

It is worth saying something when the worry stops leaving room: when it is there most of the day, when sleep or appetite goes, when panic arrives in waves, or when the future looks flat and gray instead of uncertain. Those are not character flaws or bad attitudes — they are signs of something treatable, and mentioning them to your midwife or provider opens real doors. Perinatal mental health support exists precisely for this, and asking early is a strength, not a confession.

While you wait for the world to feel steadier: say the worry out loud to someone safe, walk without a podcast sometimes, breathe slowly enough to feel your shoulders drop, and let the check-ins in this app be a place to put it down for the night.

The goal is not to stop caring. It is to let the caring fit inside your life, rather than the other way around.`,
  },
  {
    id: 'partner-first-trimester',
    title: 'What your partner should know this trimester',
    category: 'First trimester',
    featured: false,
    source: 'ACOG',
    sourceUrl: 'https://www.acog.org/womens-health/faqs/a-partners-guide-to-pregnancy',
    body: `From where you stand, the first trimester can be bewildering: there is no bump, no movement, and yet everything has changed. What she is going through is invisible and enormous — her body is building the placenta, hormones are running at levels she has never experienced, and exhaustion and nausea are not mood, they are physiology.

So, concretely: take over the cooking when smells are the enemy, and do not comment on what she can or cannot eat this week — yesterday's safe food is today's betrayal, and that is normal. Keep the crackers stocked. Let her nap without commentary. Handle the dishes, the litter box (genuinely — cat litter is one of the few real household hazards in pregnancy), and the late-night grocery run without being asked twice.

Come to the appointments when you can, especially the first one and the first scan. Ask your own questions. This is your pregnancy too — providers expect partners in the room, and being there changes how real it all feels for both of you.

Expect the emotional weather to shift quickly, and resist the urge to fix every feeling. "That sounds really hard" outperforms solutions most days. Intimacy may change shape for a while; that is common, temporary, and best handled with patience and honesty rather than scorekeeping.

And look after yourself. Partners get anxious too — about money, about fatherhood, about her. Saying so out loud, to her or to a friend, is not taking anything away from her experience. It is how you stay strong enough to hold up your half of this.`,
  },
  {
    id: 'hydration-quiet-hero',
    title: 'Water, the quiet hero',
    category: 'Your body',
    featured: false,
    source: 'ACOG',
    sourceUrl: 'https://www.acog.org/womens-health/faqs/nutrition-during-pregnancy',
    body: `If pregnancy nutrition advice had a most-underrated award, water would win every year. Your blood volume rises by roughly half over these nine months — someone has to supply the raw material — and the amniotic fluid cushioning your baby is, at heart, water too.

The usual guidance is 8 to 12 cups of fluids a day, with plain water doing most of the work. You do not need to measure obsessively: the body's own gauge is simple and slightly indelicate — pale-straw urine means you are winning, dark means drink more.

The payoff shows up in surprising places. Enough water softens constipation (a first-trimester special, made worse by iron supplements), helps prevent the dehydration headaches that masquerade as pregnancy headaches, takes an edge off fatigue, and lowers the risk of urinary tract infections. It is the cheapest symptom relief on offer.

Sipping steadily beats gulping — especially if nausea is in the picture, when a big glass can be too much and small, frequent ones go down fine. Ice-cold, room temperature, with a slice of lemon: whatever gets it in counts. Milk counts toward the total. So do water-heavy foods — watermelon, cucumber, oranges, soup. Coffee and tea count too, though caffeine stays under its own daily cap and water should still carry the load.

Keep a bottle where you actually live — by the bed, in the bag, at the desk. Hydration is not a task to complete; it is a gentle background habit, and of all the things this pregnancy will ask of you, it may be the easiest one to say yes to.`,
  },
];

export const FEATURED_ARTICLES: Article[] = ARTICLES.filter((a) => a.featured);

export function articlesByCategory(category: ArticleCategory): Article[] {
  return ARTICLES.filter((a) => a.category === category);
}
