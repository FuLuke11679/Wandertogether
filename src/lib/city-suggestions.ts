/**
 * Curated cities for destination autocomplete (prefix match on city or full label).
 */

export type CitySuggestion = {
  city: string;
  country: string;
  /** Full label shown in input, e.g. "Tokyo, Japan" */
  display: string;
};

/** Optional flag for common countries (UI hint only). */
export const COUNTRY_FLAGS: Record<string, string> = {
  Japan: "🇯🇵",
  France: "🇫🇷",
  Italy: "🇮🇹",
  Spain: "🇪🇸",
  "United Kingdom": "🇬🇧",
  "United States": "🇺🇸",
  Germany: "🇩🇪",
  Netherlands: "🇳🇱",
  Portugal: "🇵🇹",
  Greece: "🇬🇷",
  Thailand: "🇹🇭",
  Vietnam: "🇻🇳",
  Indonesia: "🇮🇩",
  Australia: "🇦🇺",
  "New Zealand": "🇳🇿",
  Mexico: "🇲🇽",
  Brazil: "🇧🇷",
  Argentina: "🇦🇷",
  Morocco: "🇲🇦",
  Egypt: "🇪🇬",
  "South Korea": "🇰🇷",
  China: "🇨🇳",
  Taiwan: "🇹🇼",
  Singapore: "🇸🇬",
  Malaysia: "🇲🇾",
  Philippines: "🇵🇭",
  India: "🇮🇳",
  Canada: "🇨🇦",
  Switzerland: "🇨🇭",
  Austria: "🇦🇹",
  Belgium: "🇧🇪",
  Sweden: "🇸🇪",
  Norway: "🇳🇴",
  Denmark: "🇩🇰",
  Ireland: "🇮🇪",
  Iceland: "🇮🇸",
  "Czech Republic": "🇨🇿",
  Poland: "🇵🇱",
  Hungary: "🇭🇺",
  Croatia: "🇭🇷",
  Turkey: "🇹🇷",
  "United Arab Emirates": "🇦🇪",
  Israel: "🇮🇱",
  "South Africa": "🇿🇦",
  Colombia: "🇨🇴",
  Peru: "🇵🇪",
  Chile: "🇨🇱",
};

export const CITY_CATALOG: CitySuggestion[] = [
  { city: "Tokyo", country: "Japan", display: "Tokyo, Japan" },
  { city: "Kyoto", country: "Japan", display: "Kyoto, Japan" },
  { city: "Osaka", country: "Japan", display: "Osaka, Japan" },
  { city: "Paris", country: "France", display: "Paris, France" },
  { city: "Lyon", country: "France", display: "Lyon, France" },
  { city: "Nice", country: "France", display: "Nice, France" },
  { city: "London", country: "United Kingdom", display: "London, United Kingdom" },
  { city: "Edinburgh", country: "United Kingdom", display: "Edinburgh, United Kingdom" },
  { city: "New York", country: "United States", display: "New York, United States" },
  { city: "Los Angeles", country: "United States", display: "Los Angeles, United States" },
  { city: "San Francisco", country: "United States", display: "San Francisco, United States" },
  { city: "Chicago", country: "United States", display: "Chicago, United States" },
  { city: "Miami", country: "United States", display: "Miami, United States" },
  { city: "Seattle", country: "United States", display: "Seattle, United States" },
  { city: "Boston", country: "United States", display: "Boston, United States" },
  { city: "Austin", country: "United States", display: "Austin, United States" },
  { city: "Denver", country: "United States", display: "Denver, United States" },
  { city: "Honolulu", country: "United States", display: "Honolulu, United States" },
  { city: "Rome", country: "Italy", display: "Rome, Italy" },
  { city: "Florence", country: "Italy", display: "Florence, Italy" },
  { city: "Milan", country: "Italy", display: "Milan, Italy" },
  { city: "Venice", country: "Italy", display: "Venice, Italy" },
  { city: "Barcelona", country: "Spain", display: "Barcelona, Spain" },
  { city: "Madrid", country: "Spain", display: "Madrid, Spain" },
  { city: "Seville", country: "Spain", display: "Seville, Spain" },
  { city: "Berlin", country: "Germany", display: "Berlin, Germany" },
  { city: "Munich", country: "Germany", display: "Munich, Germany" },
  { city: "Amsterdam", country: "Netherlands", display: "Amsterdam, Netherlands" },
  { city: "Lisbon", country: "Portugal", display: "Lisbon, Portugal" },
  { city: "Porto", country: "Portugal", display: "Porto, Portugal" },
  { city: "Athens", country: "Greece", display: "Athens, Greece" },
  { city: "Santorini", country: "Greece", display: "Santorini, Greece" },
  { city: "Bangkok", country: "Thailand", display: "Bangkok, Thailand" },
  { city: "Chiang Mai", country: "Thailand", display: "Chiang Mai, Thailand" },
  { city: "Hanoi", country: "Vietnam", display: "Hanoi, Vietnam" },
  { city: "Ho Chi Minh City", country: "Vietnam", display: "Ho Chi Minh City, Vietnam" },
  { city: "Bali", country: "Indonesia", display: "Bali, Indonesia" },
  { city: "Sydney", country: "Australia", display: "Sydney, Australia" },
  { city: "Melbourne", country: "Australia", display: "Melbourne, Australia" },
  { city: "Auckland", country: "New Zealand", display: "Auckland, New Zealand" },
  { city: "Queenstown", country: "New Zealand", display: "Queenstown, New Zealand" },
  { city: "Mexico City", country: "Mexico", display: "Mexico City, Mexico" },
  { city: "Cancún", country: "Mexico", display: "Cancún, Mexico" },
  { city: "Rio de Janeiro", country: "Brazil", display: "Rio de Janeiro, Brazil" },
  { city: "São Paulo", country: "Brazil", display: "São Paulo, Brazil" },
  { city: "Buenos Aires", country: "Argentina", display: "Buenos Aires, Argentina" },
  { city: "Marrakesh", country: "Morocco", display: "Marrakesh, Morocco" },
  { city: "Cairo", country: "Egypt", display: "Cairo, Egypt" },
  { city: "Seoul", country: "South Korea", display: "Seoul, South Korea" },
  { city: "Busan", country: "South Korea", display: "Busan, South Korea" },
  { city: "Shanghai", country: "China", display: "Shanghai, China" },
  { city: "Beijing", country: "China", display: "Beijing, China" },
  { city: "Hong Kong", country: "China", display: "Hong Kong, China" },
  { city: "Taipei", country: "Taiwan", display: "Taipei, Taiwan" },
  { city: "Singapore", country: "Singapore", display: "Singapore, Singapore" },
  { city: "Kuala Lumpur", country: "Malaysia", display: "Kuala Lumpur, Malaysia" },
  { city: "Manila", country: "Philippines", display: "Manila, Philippines" },
  { city: "Mumbai", country: "India", display: "Mumbai, India" },
  { city: "Delhi", country: "India", display: "Delhi, India" },
  { city: "Vancouver", country: "Canada", display: "Vancouver, Canada" },
  { city: "Toronto", country: "Canada", display: "Toronto, Canada" },
  { city: "Montreal", country: "Canada", display: "Montreal, Canada" },
  { city: "Zurich", country: "Switzerland", display: "Zurich, Switzerland" },
  { city: "Vienna", country: "Austria", display: "Vienna, Austria" },
  { city: "Prague", country: "Czech Republic", display: "Prague, Czech Republic" },
  { city: "Budapest", country: "Hungary", display: "Budapest, Hungary" },
  { city: "Dubrovnik", country: "Croatia", display: "Dubrovnik, Croatia" },
  { city: "Istanbul", country: "Turkey", display: "Istanbul, Turkey" },
  { city: "Dubai", country: "United Arab Emirates", display: "Dubai, United Arab Emirates" },
  { city: "Tel Aviv", country: "Israel", display: "Tel Aviv, Israel" },
  { city: "Cape Town", country: "South Africa", display: "Cape Town, South Africa" },
  { city: "Bogotá", country: "Colombia", display: "Bogotá, Colombia" },
  { city: "Lima", country: "Peru", display: "Lima, Peru" },
  { city: "Santiago", country: "Chile", display: "Santiago, Chile" },
];

export function filterCitySuggestions(
  query: string,
  limit = 8,
): CitySuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored: { item: CitySuggestion; score: number }[] = [];

  for (const c of CITY_CATALOG) {
    const cityLower = c.city.toLowerCase();
    const displayLower = c.display.toLowerCase();

    if (cityLower.startsWith(q)) {
      scored.push({ item: c, score: 0 });
    } else if (displayLower.startsWith(q)) {
      scored.push({ item: c, score: 1 });
    } else {
      const firstWord = cityLower.split(/\s+/)[0];
      if (firstWord.startsWith(q)) {
        scored.push({ item: c, score: 2 });
      }
    }
  }

  scored.sort((a, b) => a.score - b.score);
  const seen = new Set<string>();
  const out: CitySuggestion[] = [];
  for (const { item } of scored) {
    if (seen.has(item.display)) continue;
    seen.add(item.display);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

export function flagForDestination(display: string): string {
  const part = display.split(",").map((s) => s.trim());
  const country = part[part.length - 1];
  return COUNTRY_FLAGS[country] ?? "🌍";
}
