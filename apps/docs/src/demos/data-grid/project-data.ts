export type Project = { id: string; name: string; client: string; discipline: string; year: number; budget: number };

/** Fictional projects for the DataGrid examples. Budgets are in Swiss francs. */
export const PROJECTS: Project[] = [
  { id: "linie-7", name: "Linie 7", client: "Verkehrsbetriebe Luzern", discipline: "Wayfinding", year: 2025, budget: 184000 },
  { id: "atlas", name: "Atlas der Stille", client: "Kunsthalle Basel", discipline: "Editorial", year: 2024, budget: 96000 },
  { id: "velo", name: "Velo Bern", client: "Stadt Bern", discipline: "Identity", year: 2023, budget: 142000 },
  { id: "grotesk", name: "Grotesk Neu", client: "Typothek Zürich", discipline: "Type", year: 2025, budget: 58000 },
  { id: "seebad", name: "Seebad", client: "Lido Lugano", discipline: "Identity", year: 2022, budget: 74000 },
  { id: "archiv", name: "Archiv 1957", client: "ETH Bibliothek", discipline: "Editorial", year: 2024, budget: 121000 },
  { id: "rigi", name: "Bergbahn Rigi", client: "Rigi Bahnen", discipline: "Wayfinding", year: 2023, budget: 210000 },
  { id: "klang", name: "Klangraum", client: "KKL Luzern", discipline: "Exhibition", year: 2025, budget: 167000 },
  { id: "raster", name: "Raster Atlas", client: "Hochschule Luzern", discipline: "Editorial", year: 2022, budget: 45000 },
  { id: "uhrwerk", name: "Uhrwerk", client: "Atelier Biel", discipline: "Identity", year: 2024, budget: 88000 },
  { id: "park", name: "Parkleitsystem", client: "Stadt Winterthur", discipline: "Wayfinding", year: 2023, budget: 132000 },
  { id: "plakat", name: "Plakatsammlung", client: "Museum für Gestaltung", discipline: "Exhibition", year: 2025, budget: 154000 },
];

const francs = new Intl.NumberFormat("de-CH");

/** Swiss grouping, as in 184’000. */
export const formatFrancs = (value: number) => francs.format(value);
