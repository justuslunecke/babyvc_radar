import type { Place } from "./types";

/** [lon, lat] for every city referenced by the demo dataset. */
const CITY: Record<string, [string, [number, number]]> = {
  london: ["United Kingdom", [-0.1276, 51.5072]],
  berlin: ["Germany", [13.405, 52.52]],
  munich: ["Germany", [11.582, 48.1351]],
  hamburg: ["Germany", [9.9937, 53.5511]],
  paris: ["France", [2.3522, 48.8566]],
  amsterdam: ["Netherlands", [4.9041, 52.3676]],
  stockholm: ["Sweden", [18.0686, 59.3293]],
  helsinki: ["Finland", [24.9384, 60.1699]],
  copenhagen: ["Denmark", [12.5683, 55.6761]],
  oslo: ["Norway", [10.7522, 59.9139]],
  milan: ["Italy", [9.19, 45.4642]],
  rome: ["Italy", [12.4964, 41.9028]],
  barcelona: ["Spain", [2.1734, 41.3851]],
  madrid: ["Spain", [-3.7038, 40.4168]],
  lisbon: ["Portugal", [-9.1393, 38.7223]],
  zurich: ["Switzerland", [8.5417, 47.3769]],
  lausanne: ["Switzerland", [6.6323, 46.5197]],
  dublin: ["Ireland", [-6.2603, 53.3498]],
  vienna: ["Austria", [16.3738, 48.2082]],
  brussels: ["Belgium", [4.3517, 50.8503]],
  warsaw: ["Poland", [21.0122, 52.2297]],
  prague: ["Czechia", [14.4378, 50.0755]],
  tallinn: ["Estonia", [24.7536, 59.437]],
  vilnius: ["Lithuania", [25.2797, 54.6872]],
  bucharest: ["Romania", [26.1025, 44.4268]],
  athens: ["Greece", [23.7275, 37.9838]],
  istanbul: ["Türkiye", [28.9784, 41.0082]],
  telaviv: ["Israel", [34.7818, 32.0853]],
  newyork: ["United States", [-74.006, 40.7128]],
  sanfrancisco: ["United States", [-122.4194, 37.7749]],
  boston: ["United States", [-71.0589, 42.3601]],
  austin: ["United States", [-97.7431, 30.2672]],
  toronto: ["Canada", [-79.3832, 43.6532]],
  singapore: ["Singapore", [103.8198, 1.3521]],
  dubai: ["United Arab Emirates", [55.2708, 25.2048]],
  bangalore: ["India", [77.5946, 12.9716]],
  nairobi: ["Kenya", [36.8219, -1.2921]],
  saopaulo: ["Brazil", [-46.6333, -23.5505]],
  tokyo: ["Japan", [139.6917, 35.6895]],
  sydney: ["Australia", [151.2093, -33.8688]],
};

const LABEL: Record<string, string> = {
  telaviv: "Tel Aviv",
  newyork: "New York",
  sanfrancisco: "San Francisco",
  saopaulo: "São Paulo",
  zurich: "Zürich",
};

/** Look up a city by slug. Throws at module load if a slug is misspelled. */
export function place(slug: string): Place {
  const hit = CITY[slug];
  if (!hit) throw new Error(`Unknown city slug: ${slug}`);
  const [country, coords] = hit;
  const city = LABEL[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
  return { city, country, coords };
}

export const ALL_CITIES = Object.keys(CITY);
