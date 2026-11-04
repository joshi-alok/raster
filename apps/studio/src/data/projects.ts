/** Fictional projects for a fictional studio. Covers are drawn by Cover.astro from `cover`. */
export type CoverKind = "concert" | "wayfinding" | "atlas" | "bicycle" | "forum" | "report";

export type Project = {
  slug: string;
  title: string;
  client: string;
  year: number;
  disciplines: string[];
  summary: string;
  cover: CoverKind;
  coverLabel: string;
  facts: { label: string; value: string }[];
  challenge: string[];
  approach: string[];
  outcome: string[];
  results: { value: string; label: string }[];
  quote?: { text: string; author: string; role: string };
};

export const PROJECTS: Project[] = [
  {
    slug: "linie-7",
    title: "Linie 7",
    client: "Seetal Regional Rail",
    year: 2026,
    disciplines: ["Wayfinding", "Identity"],
    summary: "A sign family for fourteen stations, legible from a moving train and a wheelchair alike.",
    cover: "wayfinding",
    coverLabel: "A route line with station markers and a stack of sign panels",
    facts: [
      { label: "Client", value: "Seetal Regional Rail" },
      { label: "Scope", value: "Wayfinding, pictograms, station identity" },
      { label: "Stations", value: "14, from Lucerne to Lenzburg" },
      { label: "Team", value: "Lea Brunner, Jonas Imhof, Elias Frei" },
    ],
    challenge: [
      "Line 7 had grown station by station over forty years. Each stop carried its own signs, in four typefaces and three shades of blue, and passengers changing trains could not tell which platform they wanted.",
      "The brief asked for one system that a maintenance crew could install from a manual, and that a first-time visitor could read in the three seconds a door stays open.",
    ],
    approach: [
      "We started from the passenger's path, not the station plan. Every decision point on every platform was photographed and timed, then reduced to the one question a sign must answer there.",
      "The signs sit on a single modular grid: one panel height, three widths, and a fixed position for the line number, direction and destination. A sign never says more than its position allows.",
      "Type was set in a grotesk at three sizes only, tested at forty metres and from a seated eye height of 120 centimetres. Colour marks the line, never the meaning.",
    ],
    outcome: [
      "The system rolled out to all fourteen stations in eleven months. A crew of two can replace a panel in under an hour using the manual alone.",
      "In the first passenger survey after launch, wrong-platform reports fell by more than half.",
    ],
    results: [
      { value: "14", label: "stations on one grid" },
      { value: "3", label: "type sizes in the whole system" },
      { value: "−58%", label: "wrong-platform reports" },
    ],
    quote: {
      text: "For the first time, the line looks like one line. People notice it most by not having to think about it.",
      author: "Regula Amrein",
      role: "Head of customer experience, Seetal Regional Rail",
    },
  },
  {
    slug: "konzerthaus-seefeld",
    title: "Season 26/27",
    client: "Konzerthaus Seefeld",
    year: 2026,
    disciplines: ["Identity", "Posters"],
    summary: "A poster system for a concert hall, where every season shares one grid and no two concerts look alike.",
    cover: "concert",
    coverLabel: "Vertical bars of varying height arranged like a score on a column grid",
    facts: [
      { label: "Client", value: "Konzerthaus Seefeld" },
      { label: "Scope", value: "Season identity, 42 posters, programme book" },
      { label: "Format", value: "F4 posters, digital screens" },
      { label: "Team", value: "Mara Keller, Sofia Rossi" },
    ],
    challenge: [
      "The hall programmes forty concerts a season, from chamber music to late-night electronics, and wanted each to have its own poster without the series falling apart.",
    ],
    approach: [
      "Each poster is generated from its programme: the duration of each piece sets the height of a bar, and the bars stand on a fixed twelve-column field.",
      "Title, date and venue always sit in the same three columns, so the series reads as one family even when the compositions differ.",
    ],
    outcome: [
      "Forty-two posters, one programme book and a set of screen formats, produced by the hall's in-house team from a single template.",
    ],
    results: [
      { value: "42", label: "posters from one template" },
      { value: "1", label: "grid for print and screen" },
    ],
  },
  {
    slug: "atlas-der-alpen",
    title: "Atlas der Alpen",
    client: "Institute for Alpine Cartography",
    year: 2025,
    disciplines: ["Editorial", "Information design"],
    summary: "A 320-page atlas that sets maps, statistics and essays on one typographic system.",
    cover: "atlas",
    coverLabel: "Contour lines layered over a modular page grid",
    facts: [
      { label: "Client", value: "Institute for Alpine Cartography" },
      { label: "Scope", value: "Book design, charts, typography" },
      { label: "Extent", value: "320 pages, 140 maps" },
      { label: "Team", value: "Nico Baumann, Anouk Meier" },
    ],
    challenge: [
      "The institute's research spanned glaciers, transport and settlement. The material arrived as maps at a dozen scales and essays in three languages.",
    ],
    approach: [
      "A 24-module page grid holds maps, charts and text alike. Captions hang in the outer column; essays run in two columns of 62 characters.",
      "Every chart uses the same four tints and one accent, so a reader can compare a glacier and a timetable on facing pages.",
    ],
    outcome: ["The atlas went to a second printing within a year and is now the institute's standard reference."],
    results: [
      { value: "320", label: "pages on 24 modules" },
      { value: "140", label: "maps in one visual language" },
    ],
  },
  {
    slug: "velo-kontor",
    title: "Velo Kontor",
    client: "Velo Kontor",
    year: 2025,
    disciplines: ["Digital", "Identity"],
    summary: "A web shop for a small bicycle maker that sells by explaining, not by shouting.",
    cover: "bicycle",
    coverLabel: "Two circles and a frame of straight lines drawn on the grid",
    facts: [
      { label: "Client", value: "Velo Kontor" },
      { label: "Scope", value: "Identity, web shop, product photography direction" },
      { label: "Platform", value: "Built on the Raster design system" },
      { label: "Team", value: "Tim Suter, Sofia Rossi, Jonas Imhof" },
    ],
    challenge: [
      "Velo Kontor builds forty frames a month by hand. Its customers ask detailed questions before they buy, and the old shop answered none of them.",
    ],
    approach: [
      "Every product page follows the same order: what the bicycle is for, how it is built, what it costs and when it ships. Specifications sit in a plain table, not behind tabs.",
      "The shop meets WCAG 2.2 AA throughout, and every page works without JavaScript until the basket.",
    ],
    outcome: ["Orders through the shop doubled in the first season, and support emails fell by a third."],
    results: [
      { value: "2×", label: "online orders" },
      { value: "−33%", label: "support emails" },
    ],
  },
  {
    slug: "klima-forum",
    title: "Klima Forum 2026",
    client: "Klima Forum Zentralschweiz",
    year: 2026,
    disciplines: ["Identity", "Digital"],
    summary: "A conference identity built from a single rising line, used across stage, screen and badge.",
    cover: "forum",
    coverLabel: "A stepped line rising across twelve columns above a band of horizontal rules",
    facts: [
      { label: "Client", value: "Klima Forum Zentralschweiz" },
      { label: "Scope", value: "Identity, website, stage graphics, badges" },
      { label: "Attendees", value: "1,800 over three days" },
      { label: "Team", value: "Mara Keller, Tim Suter" },
    ],
    challenge: ["The forum wanted an identity that took the subject seriously without falling back on photographs of melting ice."],
    approach: [
      "The mark is a stepped line that rises one module per decade of measured temperature. It appears at full width on stage and as a single rule on a badge.",
    ],
    outcome: ["The identity carried the forum's first sold-out year, and its programme site scored 100 in every accessibility audit."],
    results: [
      { value: "1,800", label: "attendees" },
      { value: "3", label: "days, one line" },
    ],
  },
  {
    slug: "haus-lauben",
    title: "Annual report 2025",
    client: "Wohnbaugenossenschaft Lauben",
    year: 2025,
    disciplines: ["Editorial", "Information design"],
    summary: "An annual report for a housing cooperative, written and designed for its 2,400 members.",
    cover: "report",
    coverLabel: "Rows of small squares forming a chart beside columns of text lines",
    facts: [
      { label: "Client", value: "Wohnbaugenossenschaft Lauben" },
      { label: "Scope", value: "Report design, charts, plain-language editing" },
      { label: "Extent", value: "64 pages, print and accessible PDF" },
      { label: "Team", value: "Anouk Meier, Nico Baumann" },
    ],
    challenge: ["The cooperative's reports were written for auditors. Members, who vote on the accounts, rarely opened them."],
    approach: [
      "We rewrote the report with the board in plain language and set every figure against a question a member might ask: what does my rent pay for?",
    ],
    outcome: ["Attendance at the annual meeting rose for the first time in a decade."],
    results: [
      { value: "2,400", label: "members addressed directly" },
      { value: "64", label: "pages, print and accessible PDF" },
    ],
  },
];

export const projectBySlug = (slug: string) => PROJECTS.find((p) => p.slug === slug);
