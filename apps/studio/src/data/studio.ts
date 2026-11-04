/** Fictional studio content. Every name, address and figure here is invented. */
export const STUDIO = {
  name: "Studio Achse",
  street: "Achsenweg 4",
  city: "6003 Lucerne",
  country: "Switzerland",
  email: "hello@achse.example",
  phone: "+41 41 000 00 00",
  hours: "Monday to Friday, 9:00 to 17:30",
};

export const SERVICES = [
  {
    title: "Identity",
    body: "Marks, typography and the rules that keep them consistent, written so a team can use them without us.",
  },
  {
    title: "Wayfinding",
    body: "Sign systems for stations, hospitals and campuses, planned from the visitor's path and tested on site.",
  },
  {
    title: "Editorial",
    body: "Books, reports and magazines set on grids that carry text, images and data with equal care.",
  },
  {
    title: "Digital",
    body: "Websites and products built on accessible design systems, from the first wireframe to the last release.",
  },
];

export const FIGURES = [
  { value: "2011", label: "founded in Lucerne" },
  { value: "8", label: "designers and one developer" },
  { value: "120+", label: "projects delivered" },
  { value: "AA", label: "WCAG level on every site we ship" },
];

export const CLIENTS = [
  "Seetal Regional Rail",
  "Konzerthaus Seefeld",
  "Institute for Alpine Cartography",
  "Velo Kontor",
  "Klima Forum Zentralschweiz",
  "Wohnbaugenossenschaft Lauben",
  "Kantonsspital Nord",
  "Verlag am See",
];

export const PRINCIPLES = [
  {
    title: "Content first",
    body: "We read before we draw. The structure of a project comes from what it has to say and who it is for.",
  },
  {
    title: "One grid, many uses",
    body: "A good system is strict where it matters and open everywhere else, so it survives people we never meet.",
  },
  {
    title: "Everyone reads",
    body: "Legibility and accessibility are part of the design, checked like any other detail, not added at the end.",
  },
];

export const STEPS = [
  { title: "Listen", body: "Two to four weeks of interviews, site visits and reading. We write down the problem before solving it." },
  { title: "Structure", body: "Grids, hierarchies and rules, tested on the hardest real content first." },
  { title: "Design", body: "Form, colour and detail, reviewed with the people who will use the work every day." },
  { title: "Hand over", body: "Manuals, templates and code, so the system keeps working after we leave." },
];

export const PEOPLE = [
  { name: "Lea Brunner", role: "Founder, creative director" },
  { name: "Jonas Imhof", role: "Partner, wayfinding" },
  { name: "Mara Keller", role: "Design director, identity" },
  { name: "Nico Baumann", role: "Senior designer, editorial" },
  { name: "Sofia Rossi", role: "Designer, identity and digital" },
  { name: "Elias Frei", role: "Designer, wayfinding" },
  { name: "Anouk Meier", role: "Designer, information design" },
  { name: "Tim Suter", role: "Developer, design systems" },
];

export const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("");
