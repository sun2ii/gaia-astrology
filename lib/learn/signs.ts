/**
 * LEARN · SIGNS — long-form reference for each zodiac sign.
 *
 * Interpretive content (traditional Western astrology, written plainly for a
 * beginner). Like lib/astrology/interpretations.ts this is data the engine
 * never reads. The astronomy facts (dates, constellation offset) are real.
 */
import type { ZodiacSign } from "@/lib/astrology/types";

export type SignEntry = {
  sign: ZodiacSign;
  symbol: string;
  /** Approximate Sun-sign dates (they shift by a day either way from year to year). */
  dates: string;
  element: "Fire" | "Earth" | "Air" | "Water";
  mode: "Cardinal" | "Fixed" | "Mutable";
  ruler: string;
  opposite: ZodiacSign;
  /** The image the sign is named after. */
  image: string;
  /** One-paragraph essence. */
  essence: string;
  /** What the sign is like at its best. */
  strengths: string;
  /** Its characteristic difficulties. */
  challenges: string;
  /** How the sign shows up in each of the Big Three. */
  asSun: string;
  asMoon: string;
  asRising: string;
  /** Style in relationships and at work, used by the placement composer. */
  inLove: string;
  atWork: string;
  /** Verbs and adjectives the composer can lean on. */
  keywords: string[];
};

export const SIGNS: Record<ZodiacSign, SignEntry> = {
  Aries: {
    sign: "Aries",
    symbol: "♈",
    dates: "about March 21 – April 19",
    element: "Fire",
    mode: "Cardinal",
    ruler: "Mars",
    opposite: "Libra",
    image: "the Ram",
    essence:
      "Aries is the first sign, the spark that starts the zodiac year at the spring equinox. Its whole style is beginning: acting on impulse, going first, meeting life head-on. Aries energy is direct and uncomplicated — it wants a clear goal and a straight line to it.",
    strengths: "Courage, honesty, initiative. Aries gets things moving when everyone else is still talking, recovers quickly from setbacks, and rarely holds a grudge.",
    challenges: "Impatience and a short fuse. Aries can start far more than it finishes, take disagreement personally, and mistake speed for progress.",
    asSun: "A Sun in Aries person is built for beginnings: new projects, new places, the first move. They feel most alive with a challenge in front of them and least alive waiting in line.",
    asMoon: "Feelings arrive fast and hot and pass just as quickly. Comfort comes from action — a run, a decision, a clean break — not from talking it through.",
    asRising: "The first impression is energy: quick, frank, a little impatient. People with Aries rising tend to walk into rooms rather than enter them.",
    inLove: "direct and ardent, pursuing openly and losing interest when the chase stops",
    atWork: "a starter and a competitor, best given autonomy and a target",
    keywords: ["bold", "direct", "impatient", "pioneering", "quick"],
  },
  Taurus: {
    sign: "Taurus",
    symbol: "♉",
    dates: "about April 20 – May 20",
    element: "Earth",
    mode: "Fixed",
    ruler: "Venus",
    opposite: "Scorpio",
    image: "the Bull",
    essence:
      "Taurus is the zodiac's anchor: the sign of the body, the senses, and things that last. Where Aries starts, Taurus builds and keeps. It moves slowly on purpose, values what is real and touchable, and trusts time more than talk.",
    strengths: "Patience, loyalty, an eye for quality. Taurus finishes what it starts, keeps promises, and creates comfort wherever it settles.",
    challenges: "Stubbornness and inertia. Taurus can dig in past the point of sense, resist change it actually needs, and confuse comfort with happiness.",
    asSun: "A Sun in Taurus person wants a life that feels solid: good food, a reliable routine, work that produces something you can point to. They are slow to commit and slower to leave.",
    asMoon: "Emotional security means physical security — a full fridge, a paid bill, a familiar chair. Upset shows as withdrawal and a need for quiet, not drama.",
    asRising: "The first impression is calm and grounded, sometimes reserved. Taurus rising people are noticed for their steadiness and, often, a good voice or a good eye.",
    inLove: "steady, sensual and possessive, offering loyalty and expecting it back",
    atWork: "reliable and thorough, happiest building something durable at its own pace",
    keywords: ["steady", "sensual", "stubborn", "loyal", "patient"],
  },
  Gemini: {
    sign: "Gemini",
    symbol: "♊",
    dates: "about May 21 – June 20",
    element: "Air",
    mode: "Mutable",
    ruler: "Mercury",
    opposite: "Sagittarius",
    image: "the Twins",
    essence:
      "Gemini is the sign of the curious mind: questions, conversation, connections between things. Its symbol is a pair, and Gemini often holds two views at once. It is quick, verbal and restless, more interested in learning about everything than mastering one thing.",
    strengths: "Wit, adaptability, communication. Gemini can talk to anyone, learn anything quickly, and see the funny side of almost everything.",
    challenges: "Scattered attention and inconsistency. Gemini can skim where depth is needed, say what it does not quite mean, and get bored before the interesting part.",
    asSun: "A Sun in Gemini person is a collector of ideas and people. They thrive on variety and conversation and wilt in routine or silence.",
    asMoon: "Feelings are processed by talking and thinking them through. Moon in Gemini needs to name what it feels — and may change its mind about it by tomorrow.",
    asRising: "The first impression is bright, chatty and youthful. Gemini rising people put others at ease with words and tend to look younger than they are.",
    inLove: "playful and communicative, needing mental connection more than grand gestures",
    atWork: "quick and versatile, best with variety, words, and people to bounce off",
    keywords: ["curious", "quick", "talkative", "restless", "adaptable"],
  },
  Cancer: {
    sign: "Cancer",
    symbol: "♋",
    dates: "about June 21 – July 22",
    element: "Water",
    mode: "Cardinal",
    ruler: "the Moon",
    opposite: "Capricorn",
    image: "the Crab",
    essence:
      "Cancer begins at the summer solstice and is the sign of home, memory and care. Like its crab, it carries its shelter with it and approaches sideways. Cancer feels everything, remembers everything, and protects what it loves with surprising force.",
    strengths: "Empathy, loyalty, intuition. Cancer notices what others need before they say it and builds places where people feel safe.",
    challenges: "Moodiness and defensiveness. Cancer can retreat into its shell at the first hurt, hold onto old wounds, and smother where it means to protect.",
    asSun: "A Sun in Cancer person is oriented around belonging — family, home, a chosen tribe. Their confidence rises and falls with how safe they feel.",
    asMoon: "The Moon is at home here. Feelings are deep, tidal and unhidden; comfort comes from familiar people, food and places.",
    asRising: "The first impression is warm but guarded. Cancer rising people seem approachable and kind, and take a while to really open up.",
    inLove: "nurturing, devoted and sensitive, needing to feel safe before it can feel anything else",
    atWork: "protective of the team and the tradition, excellent at caring for people and places",
    keywords: ["nurturing", "protective", "moody", "home-loving", "intuitive"],
  },
  Leo: {
    sign: "Leo",
    symbol: "♌",
    dates: "about July 23 – August 22",
    element: "Fire",
    mode: "Fixed",
    ruler: "the Sun",
    opposite: "Aquarius",
    image: "the Lion",
    essence:
      "Leo is ruled by the Sun and behaves like it: warm, central, generous with light. It is the sign of self-expression, play and pride. Leo wants to be seen doing something well, and wants the people it loves to shine too.",
    strengths: "Generosity, warmth, courage. Leo makes people feel special, holds a room, and stays loyal when things get hard.",
    challenges: "Pride and a need for applause. Leo can take criticism as betrayal, dominate where it means to lead, and sulk when it isn't noticed.",
    asSun: "A Sun in Leo person is here to create and to be recognised for it. They do best with a stage of some kind — a craft, a family, a team — and an audience that appreciates it.",
    asMoon: "Feelings are big and theatrical, and comfort comes from being adored. Moon in Leo needs to feel special to feel safe.",
    asRising: "The first impression is confident, warm and a little regal. Leo rising people are noticed — hair, laugh, presence.",
    inLove: "romantic, generous and loyal, wanting to be admired and to admire in return",
    atWork: "a natural leader and performer, best where excellence is visible and rewarded",
    keywords: ["warm", "proud", "generous", "dramatic", "loyal"],
  },
  Virgo: {
    sign: "Virgo",
    symbol: "♍",
    dates: "about August 23 – September 22",
    element: "Earth",
    mode: "Mutable",
    ruler: "Mercury",
    opposite: "Pisces",
    image: "the Maiden (often shown holding wheat — the harvest)",
    essence:
      "Virgo is the sign of the harvest: sorting, refining, making useful. It sees detail others miss and cannot help wanting to improve things. Virgo's care is practical — it shows love by fixing, organising and noticing.",
    strengths: "Precision, helpfulness, discernment. Virgo is the person who actually reads the instructions, and the friend who quietly makes your life work better.",
    challenges: "Worry and self-criticism. Virgo can hold itself and others to impossible standards, fuss over the small thing while the big thing waits, and struggle to accept 'good enough'.",
    asSun: "A Sun in Virgo person is here to be useful and to get things right. They are happiest with a craft to perfect and a problem to solve, and hardest on themselves.",
    asMoon: "Feelings are analysed before they are felt. Moon in Virgo finds comfort in order, routine and being helpful — and worries when things are messy or out of control.",
    asRising: "The first impression is modest, neat and observant. Virgo rising people seem competent and slightly reserved, and notice everything about you.",
    inLove: "attentive and practical, showing love through acts of service and small improvements",
    atWork: "meticulous and dependable, the one who catches the error before it ships",
    keywords: ["precise", "helpful", "analytical", "self-critical", "practical"],
  },
  Libra: {
    sign: "Libra",
    symbol: "♎",
    dates: "about September 23 – October 22",
    element: "Air",
    mode: "Cardinal",
    ruler: "Venus",
    opposite: "Aries",
    image: "the Scales",
    essence:
      "Libra begins at the autumn equinox, when day and night are equal, and it is the sign of balance: fairness, partnership, beauty. The only zodiac sign that is an object rather than a creature, Libra weighs, compares and seeks the harmonious middle.",
    strengths: "Diplomacy, charm, a sense of fairness. Libra sees every side, smooths conflict, and has an instinct for what looks and feels right.",
    challenges: "Indecision and people-pleasing. Libra can weigh so long the moment passes, avoid necessary conflict, and lose itself in the other person.",
    asSun: "A Sun in Libra person defines itself through relationship — a partner, a collaborator, an audience. They are at their best with someone to balance against.",
    asMoon: "Emotional comfort comes from harmony; discord is physically uncomfortable. Moon in Libra needs peace in the room to feel peace inside.",
    asRising: "The first impression is graceful, agreeable and well put together. Libra rising people are easy to like and hard to read.",
    inLove: "romantic, considerate and partnership-minded, sometimes at the cost of its own wants",
    atWork: "a negotiator and aesthete, best in roles that need tact, taste and a sense of fairness",
    keywords: ["diplomatic", "fair", "charming", "indecisive", "harmonious"],
  },
  Scorpio: {
    sign: "Scorpio",
    symbol: "♏",
    dates: "about October 23 – November 21",
    element: "Water",
    mode: "Fixed",
    ruler: "Mars (traditional) and Pluto (modern)",
    opposite: "Taurus",
    image: "the Scorpion",
    essence:
      "Scorpio is the sign of depth: what is hidden, what is intense, what transforms. It does not do surface. Scorpio wants the truth under the story, commits totally or not at all, and survives what would break other signs.",
    strengths: "Loyalty, focus, emotional courage. Scorpio keeps secrets, sees through pretence, and stays when things get dark.",
    challenges: "Jealousy, control and grudges. Scorpio can test people, hold onto hurt for years, and mistake intensity for intimacy.",
    asSun: "A Sun in Scorpio person is drawn to whatever is real and consequential — deep work, deep bonds, crisis. They reveal themselves slowly and completely.",
    asMoon: "Feelings run deep and private. Moon in Scorpio needs total trust to feel safe and rarely shows what it is really feeling until it is sure.",
    asRising: "The first impression is magnetic and unreadable. Scorpio rising people are noticed for their gaze and their reserve.",
    inLove: "all-or-nothing, passionate and possessive, demanding honesty and offering devotion",
    atWork: "relentless and strategic, excellent at research, investigation, and anything requiring nerve",
    keywords: ["intense", "private", "loyal", "all-or-nothing", "perceptive"],
  },
  Sagittarius: {
    sign: "Sagittarius",
    symbol: "♐",
    dates: "about November 22 – December 21",
    element: "Fire",
    mode: "Mutable",
    ruler: "Jupiter",
    opposite: "Gemini",
    image: "the Archer (a centaur aiming at the sky)",
    essence:
      "Sagittarius is the sign of the horizon: travel, philosophy, the big question. Its archer aims high and far. Sagittarius wants meaning and freedom, laughs easily, and would rather be honest than tactful.",
    strengths: "Optimism, honesty, breadth. Sagittarius lifts the mood, sees the big picture, and keeps growing all its life.",
    challenges: "Bluntness and restlessness. Sagittarius can over-promise, wound with the truth, and leave before the hard part.",
    asSun: "A Sun in Sagittarius person needs room — to travel, to learn, to believe in something. They suffocate in small talk and small plans.",
    asMoon: "Comfort comes from freedom and perspective; a change of scene fixes most moods. Moon in Sagittarius feels trapped by heavy emotion and lightens it with humour.",
    asRising: "The first impression is open, enthusiastic and a bit loud. Sagittarius rising people seem like they just got back from somewhere interesting.",
    inLove: "warm, honest and freedom-loving, needing a partner in adventure more than a settled routine",
    atWork: "a visionary and a teacher, best with autonomy, travel, or ideas to spread",
    keywords: ["adventurous", "honest", "optimistic", "blunt", "philosophical"],
  },
  Capricorn: {
    sign: "Capricorn",
    symbol: "♑",
    dates: "about December 22 – January 19",
    element: "Earth",
    mode: "Cardinal",
    ruler: "Saturn",
    opposite: "Cancer",
    image: "the Sea-Goat (a goat with a fish's tail — climbing, but born of the deep)",
    essence:
      "Capricorn begins at the winter solstice, the longest night, and it is the sign of the long climb: ambition, discipline, structure. It plays the long game, respects what has been earned, and tends to get younger as it ages.",
    strengths: "Discipline, responsibility, dry humour. Capricorn shows up, does the work, and builds things that outlast the people who doubted them.",
    challenges: "Pessimism and rigidity. Capricorn can mistake control for safety, work instead of feel, and judge itself harshly for being human.",
    asSun: "A Sun in Capricorn person is oriented around achievement and legitimacy — doing it properly, being taken seriously. They mature early and loosen up late.",
    asMoon: "Feelings are managed, not indulged. Moon in Capricorn finds comfort in competence and self-reliance, and struggles to ask for help.",
    asRising: "The first impression is serious, capable and a little formal. Capricorn rising people seem older than they are, then age in reverse.",
    inLove: "loyal, slow to open, and committed once it has decided — a builder rather than a romantic",
    atWork: "an executive and a strategist, best with authority, a ladder, and a long horizon",
    keywords: ["ambitious", "disciplined", "cautious", "dry-humoured", "enduring"],
  },
  Aquarius: {
    sign: "Aquarius",
    symbol: "♒",
    dates: "about January 20 – February 18",
    element: "Air",
    mode: "Fixed",
    ruler: "Saturn (traditional) and Uranus (modern)",
    opposite: "Leo",
    image: "the Water-Bearer (pouring water — an air sign, despite the name)",
    essence:
      "Aquarius is the sign of the group and the future: ideas, ideals, systems, friendship. It stands a little outside the room to see the whole room. Aquarius values independence and principle and is often ahead of its time — which can look like being out of step.",
    strengths: "Originality, fairness, loyalty to friends and causes. Aquarius thinks for itself, treats people as equals, and imagines what does not exist yet.",
    challenges: "Detachment and contrarianism. Aquarius can intellectualise feeling, rebel on reflex, and be humane to humanity while distant with the human in front of it.",
    asSun: "A Sun in Aquarius person is here to be themselves and to improve the group. They resist labels, value freedom, and need a community or a cause.",
    asMoon: "Feelings are observed from a slight distance. Moon in Aquarius needs space and friendship, and finds comfort in ideas more than in being held.",
    asRising: "The first impression is friendly, unusual and a little cool. Aquarius rising people seem interesting and hard to pin down.",
    inLove: "friendship-first, loyal and unconventional, needing freedom inside the bond",
    atWork: "an innovator and a team player, best with a mission, a network, and room to do it differently",
    keywords: ["independent", "inventive", "humanitarian", "detached", "principled"],
  },
  Pisces: {
    sign: "Pisces",
    symbol: "♓",
    dates: "about February 19 – March 20",
    element: "Water",
    mode: "Mutable",
    ruler: "Jupiter (traditional) and Neptune (modern)",
    opposite: "Virgo",
    image: "two Fish, tied together, swimming in opposite directions",
    essence:
      "Pisces is the last sign, the one that ends the zodiac year just before the spring equinox, and it holds something of all the others. It is the sign of empathy, imagination and dissolving boundaries: between self and other, real and imagined, now and forever. Pisces feels what is in the room and dreams past it.",
    strengths: "Compassion, creativity, intuition. Pisces understands without being told, forgives what others can't, and makes art, music or kindness out of whatever it is given.",
    challenges: "Escapism and porous boundaries. Pisces can absorb other people's moods, avoid hard reality through fantasy or distraction, and lose track of what it actually wants.",
    asSun: "A Sun in Pisces person is here to feel, imagine and connect. They need creative or spiritual outlets, time alone to reset, and people who do not take advantage of their softness.",
    asMoon: "The most sensitive Moon. Feelings are oceanic and easily influenced; comfort comes from music, water, solitude and being understood without explaining.",
    asRising: "The first impression is gentle, dreamy and hard to pin down. Pisces rising people seem to reflect whoever they are with, and their eyes get mentioned a lot.",
    inLove: "romantic, devoted and idealising, giving deeply and sometimes losing itself in the other person",
    atWork: "imaginative and empathetic, best in creative, caring or behind-the-scenes roles with room to drift and return",
    keywords: ["compassionate", "dreamy", "intuitive", "boundary-blurring", "imaginative"],
  },
};

export const SIGN_ORDER: ZodiacSign[] = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

export const ELEMENT_NOTE: Record<SignEntry["element"], string> = {
  Fire: "Fire signs (Aries, Leo, Sagittarius) run on energy, enthusiasm and action. They light up a room and burn out if they can't move.",
  Earth: "Earth signs (Taurus, Virgo, Capricorn) run on the practical and the real. They build, keep and finish, and distrust what can't be touched.",
  Air: "Air signs (Gemini, Libra, Aquarius) run on ideas, words and connection. They think first, relate through conversation, and need mental space.",
  Water: "Water signs (Cancer, Scorpio, Pisces) run on feeling and intuition. They sense what is unspoken, bond deeply, and need emotional safety.",
};

export const MODE_NOTE: Record<SignEntry["mode"], string> = {
  Cardinal: "Cardinal signs (Aries, Cancer, Libra, Capricorn) start each season and start things in general — initiators.",
  Fixed: "Fixed signs (Taurus, Leo, Scorpio, Aquarius) sit in the middle of each season and hold things steady — sustainers, sometimes stubborn.",
  Mutable: "Mutable signs (Gemini, Virgo, Sagittarius, Pisces) end each season and adapt to what comes next — flexible, sometimes scattered.",
};
