/* My Points Butler — destination + offer data.
   All point figures are illustrative. Each offer carries a "now" cost and the
   butler's best-predicted future window, so the UI can compute use-now-vs-save. */

export type Tone = "save" | "now" | "neutral";

export interface Offer {
  name: string;
  sub: string;
  now: number;
  later: number;
  when: string;
  conf: "High" | "Medium" | "Low";
}

export interface Destination {
  id: string;
  city: string;
  country: string;
  flag: string;
  lat: number;
  lon: number;
  blurb: string;
  bestWindow: string;
  accent: string;
  flights: Offer[];
  hotels: Offer[];
}

export interface Verdict {
  key: "wait-strong" | "wait" | "tossup" | "now";
  label: string;
  tone: Tone;
  pct: number;
  save: number;
}

export interface Summary {
  best: { o: Offer; v: Verdict };
  maxSave: number;
  maxPct: number;
  netPct: number;
  window: string;
  tone: Tone;
}

// lat/lon used to project pins onto the equirectangular dotted map.
export const DESTINATIONS: Destination[] = [
  {
    id: "tokyo",
    city: "Tokyo",
    country: "Japan",
    flag: "🇯🇵",
    lat: 35.68,
    lon: 139.69,
    blurb: "Cherry-blossom shoulder season is the sweet spot.",
    bestWindow: "Late Feb – Mar 2027",
    accent: "#4DABF7",
    flights: [
      { name: "ANA — Nonstop", sub: "Business · 1 stop saver", now: 142000, later: 88000, when: "Feb 2027", conf: "High" },
      { name: "JAL Economy", sub: "Nonstop · 11h", now: 62000, later: 48000, when: "Mar 2027", conf: "High" },
      { name: "United Saver", sub: "1 stop · SFO", now: 80000, later: 86000, when: "Aug 2026", conf: "Medium" },
    ],
    hotels: [
      { name: "Park Hyatt Tokyo", sub: "5★ · per night", now: 45000, later: 26000, when: "Feb 2027", conf: "High" },
      { name: "Hoshinoya Tokyo", sub: "Ryokan · per night", now: 60000, later: 41000, when: "Mar 2027", conf: "Medium" },
      { name: "Aman Tokyo", sub: "5★ · per night", now: 95000, later: 98000, when: "Apr 2026", conf: "Medium" },
    ],
  },
  {
    id: "bali",
    city: "Bali",
    country: "Indonesia",
    flag: "🇮🇩",
    lat: -8.34,
    lon: 115.09,
    blurb: "Dry season fares dip hard once the crowds thin out.",
    bestWindow: "May – Jun 2027",
    accent: "#3BC9DB",
    flights: [
      { name: "Singapore Air", sub: "Business · 1 stop", now: 165000, later: 96000, when: "May 2027", conf: "High" },
      { name: "Qatar Economy", sub: "1 stop · DOH", now: 72000, later: 51000, when: "Jun 2027", conf: "High" },
      { name: "Cathay Saver", sub: "1 stop · HKG", now: 88000, later: 79000, when: "Sep 2026", conf: "Medium" },
    ],
    hotels: [
      { name: "Four Seasons Sayan", sub: "5★ · per night", now: 78000, later: 39000, when: "May 2027", conf: "High" },
      { name: "COMO Uma Ubud", sub: "5★ · per night", now: 44000, later: 31000, when: "Jun 2027", conf: "High" },
      { name: "Alila Villas", sub: "5★ · per night", now: 52000, later: 55000, when: "Jul 2026", conf: "Low" },
    ],
  },
  {
    id: "paris",
    city: "Paris",
    country: "France",
    flag: "🇫🇷",
    lat: 48.85,
    lon: 2.35,
    blurb: "Shoulder-season award space opens up after summer.",
    bestWindow: "Sep – Oct 2026",
    accent: "#9775FA",
    flights: [
      { name: "Air France", sub: "Business · Nonstop", now: 120000, later: 75000, when: "Oct 2026", conf: "High" },
      { name: "Delta Economy", sub: "Nonstop · 7h", now: 55000, later: 44000, when: "Sep 2026", conf: "High" },
      { name: "Aer Lingus", sub: "1 stop · DUB", now: 60000, later: 64000, when: "Jul 2026", conf: "Medium" },
    ],
    hotels: [
      { name: "Le Bristol", sub: "Palace · per night", now: 82000, later: 58000, when: "Oct 2026", conf: "Medium" },
      { name: "Hôtel Lutetia", sub: "5★ · per night", now: 50000, later: 38000, when: "Sep 2026", conf: "High" },
      { name: "Cheval Blanc", sub: "Palace · per night", now: 110000, later: 112000, when: "May 2026", conf: "Low" },
    ],
  },
  {
    id: "nyc",
    city: "New York",
    country: "USA",
    flag: "🇺🇸",
    lat: 40.71,
    lon: -74.0,
    blurb: "Prices are climbing into the holidays — lock it in.",
    bestWindow: "Book now",
    accent: "#FF8787",
    flights: [
      { name: "JetBlue Mint", sub: "Business · Nonstop", now: 55000, later: 64000, when: "Dec 2026", conf: "High" },
      { name: "Alaska Saver", sub: "Nonstop · 5h", now: 25000, later: 30000, when: "Nov 2026", conf: "High" },
      { name: "American Economy", sub: "Nonstop · 6h", now: 30000, later: 28000, when: "Feb 2027", conf: "Medium" },
    ],
    hotels: [
      { name: "The Times Square Edition", sub: "5★ · per night", now: 60000, later: 69000, when: "Dec 2026", conf: "High" },
      { name: "1 Hotel Central Park", sub: "5★ · per night", now: 48000, later: 54000, when: "Nov 2026", conf: "Medium" },
      { name: "Aman New York", sub: "5★ · per night", now: 150000, later: 161000, when: "Mar 2027", conf: "Medium" },
    ],
  },
  {
    id: "maldives",
    city: "Maldives",
    country: "Indian Ocean",
    flag: "🇲🇻",
    lat: 3.2,
    lon: 73.22,
    blurb: "Overwater villas plummet right after peak season.",
    bestWindow: "May – Jul 2027",
    accent: "#20C997",
    flights: [
      { name: "Emirates", sub: "Business · 1 stop DXB", now: 180000, later: 102000, when: "Jun 2027", conf: "High" },
      { name: "Qatar Economy", sub: "1 stop · DOH", now: 80000, later: 56000, when: "May 2027", conf: "High" },
      { name: "Etihad Saver", sub: "1 stop · AUH", now: 95000, later: 88000, when: "Oct 2026", conf: "Medium" },
    ],
    hotels: [
      { name: "Soneva Jani", sub: "Overwater · per night", now: 140000, later: 72000, when: "Jun 2027", conf: "High" },
      { name: "Waldorf Astoria", sub: "Overwater · per night", now: 95000, later: 54000, when: "May 2027", conf: "High" },
      { name: "St. Regis Vommuli", sub: "Overwater · per night", now: 88000, later: 90000, when: "Dec 2026", conf: "Low" },
    ],
  },
  {
    id: "lisbon",
    city: "Lisbon",
    country: "Portugal",
    flag: "🇵🇹",
    lat: 38.72,
    lon: -9.14,
    blurb: "A modest wait trims fares — not a dramatic one.",
    bestWindow: "Oct – Nov 2026",
    accent: "#FAB005",
    flights: [
      { name: "TAP Air Portugal", sub: "Business · Nonstop", now: 88000, later: 72000, when: "Nov 2026", conf: "Medium" },
      { name: "United Economy", sub: "Nonstop · 7h", now: 44000, later: 41000, when: "Oct 2026", conf: "High" },
      { name: "Lufthansa", sub: "1 stop · FRA", now: 52000, later: 50000, when: "Jan 2027", conf: "Medium" },
    ],
    hotels: [
      { name: "Four Seasons Ritz", sub: "5★ · per night", now: 55000, later: 44000, when: "Nov 2026", conf: "Medium" },
      { name: "Bairro Alto Hotel", sub: "5★ · per night", now: 38000, later: 33000, when: "Oct 2026", conf: "High" },
      { name: "Memmo Príncipe Real", sub: "4★ · per night", now: 30000, later: 31000, when: "Dec 2026", conf: "Low" },
    ],
  },
  {
    id: "capetown",
    city: "Cape Town",
    country: "South Africa",
    flag: "🇿🇦",
    lat: -33.92,
    lon: 18.42,
    blurb: "Off-peak award space is wide open and deeply discounted.",
    bestWindow: "May – Aug 2027",
    accent: "#F783AC",
    flights: [
      { name: "Qatar Airways", sub: "Business · 1 stop", now: 175000, later: 99000, when: "Jun 2027", conf: "High" },
      { name: "Turkish Economy", sub: "1 stop · IST", now: 78000, later: 52000, when: "Jul 2027", conf: "High" },
      { name: "Emirates Saver", sub: "1 stop · DXB", now: 92000, later: 85000, when: "Nov 2026", conf: "Medium" },
    ],
    hotels: [
      { name: "Ellerman House", sub: "5★ · per night", now: 70000, later: 40000, when: "Jun 2027", conf: "High" },
      { name: "One&Only Cape Town", sub: "5★ · per night", now: 58000, later: 37000, when: "Jul 2027", conf: "High" },
      { name: "The Silo", sub: "5★ · per night", now: 64000, later: 66000, when: "Dec 2026", conf: "Low" },
    ],
  },
  {
    id: "reykjavik",
    city: "Reykjavík",
    country: "Iceland",
    flag: "🇮🇸",
    lat: 64.15,
    lon: -21.94,
    blurb: "Northern-lights season holds steady — small upside to waiting.",
    bestWindow: "Sep – Oct 2026",
    accent: "#748FFC",
    flights: [
      { name: "Icelandair", sub: "Saga · Nonstop", now: 70000, later: 58000, when: "Oct 2026", conf: "Medium" },
      { name: "Delta Economy", sub: "Nonstop · 6h", now: 38000, later: 35000, when: "Sep 2026", conf: "High" },
      { name: "Icelandair Eco", sub: "Nonstop · 6h", now: 30000, later: 31000, when: "Nov 2026", conf: "Low" },
    ],
    hotels: [
      { name: "The Retreat at Blue Lagoon", sub: "5★ · per night", now: 90000, later: 62000, when: "Oct 2026", conf: "Medium" },
      { name: "Hotel Borg", sub: "4★ · per night", now: 40000, later: 35000, when: "Sep 2026", conf: "High" },
      { name: "Ion City Hotel", sub: "4★ · per night", now: 34000, later: 35000, when: "Dec 2026", conf: "Low" },
    ],
  },
  {
    id: "losangeles",
    city: "Los Angeles",
    country: "USA",
    flag: "🇺🇸",
    lat: 34.05,
    lon: -118.24,
    blurb: "Award space loosens up once peak summer fades.",
    bestWindow: "Sep – Oct 2026",
    accent: "#FFB454",
    flights: [
      { name: "Delta One", sub: "Business · Nonstop", now: 95000, later: 68000, when: "Oct 2026", conf: "High" },
      { name: "Alaska Saver", sub: "Nonstop · 6h", now: 32000, later: 27000, when: "Sep 2026", conf: "High" },
      { name: "United Economy", sub: "Nonstop · 5h", now: 28000, later: 29000, when: "Jul 2026", conf: "Medium" },
    ],
    hotels: [
      { name: "Waldorf Astoria Beverly Hills", sub: "5★ · per night", now: 72000, later: 48000, when: "Oct 2026", conf: "High" },
      { name: "Hotel Bel-Air", sub: "5★ · per night", now: 88000, later: 64000, when: "Sep 2026", conf: "Medium" },
      { name: "Shutters on the Beach", sub: "5★ · per night", now: 50000, later: 52000, when: "Jun 2026", conf: "Low" },
    ],
  },
  {
    id: "london",
    city: "London",
    country: "United Kingdom",
    flag: "🇬🇧",
    lat: 51.51,
    lon: -0.13,
    blurb: "Off-season fares dip nicely after the holidays.",
    bestWindow: "Jan – Feb 2027",
    accent: "#5C7CFA",
    flights: [
      { name: "British Airways", sub: "Club World · Nonstop", now: 130000, later: 82000, when: "Jan 2027", conf: "High" },
      { name: "Virgin Atlantic", sub: "Economy · Nonstop", now: 58000, later: 45000, when: "Feb 2027", conf: "High" },
      { name: "American Saver", sub: "1 stop · ORD", now: 60000, later: 62000, when: "Jun 2026", conf: "Medium" },
    ],
    hotels: [
      { name: "The Savoy", sub: "5★ · per night", now: 85000, later: 56000, when: "Jan 2027", conf: "High" },
      { name: "The Connaught", sub: "5★ · per night", now: 95000, later: 70000, when: "Feb 2027", conf: "Medium" },
      { name: "The Ned", sub: "5★ · per night", now: 52000, later: 53000, when: "Dec 2026", conf: "Low" },
    ],
  },
  {
    id: "rio",
    city: "Rio de Janeiro",
    country: "Brazil",
    flag: "🇧🇷",
    lat: -22.91,
    lon: -43.17,
    blurb: "Skip Carnaval pricing and fares collapse afterward.",
    bestWindow: "Apr – May 2027",
    accent: "#38D9A9",
    flights: [
      { name: "LATAM Business", sub: "Business · 1 stop", now: 160000, later: 92000, when: "Apr 2027", conf: "High" },
      { name: "United Economy", sub: "1 stop · IAH", now: 70000, later: 49000, when: "May 2027", conf: "High" },
      { name: "American Saver", sub: "1 stop · MIA", now: 82000, later: 75000, when: "Sep 2026", conf: "Medium" },
    ],
    hotels: [
      { name: "Copacabana Palace", sub: "5★ · per night", now: 68000, later: 38000, when: "Apr 2027", conf: "High" },
      { name: "Fasano Rio", sub: "5★ · per night", now: 56000, later: 36000, when: "May 2027", conf: "High" },
      { name: "Hotel Emiliano", sub: "5★ · per night", now: 48000, later: 50000, when: "Dec 2026", conf: "Low" },
    ],
  },
  {
    id: "buenosaires",
    city: "Buenos Aires",
    country: "Argentina",
    flag: "🇦🇷",
    lat: -34.6,
    lon: -58.38,
    blurb: "Shoulder-season award space is deep and cheap.",
    bestWindow: "Mar – Apr 2027",
    accent: "#74C0FC",
    flights: [
      { name: "Aerolíneas Plus", sub: "Business · Nonstop", now: 150000, later: 88000, when: "Mar 2027", conf: "High" },
      { name: "Delta Economy", sub: "1 stop · ATL", now: 66000, later: 47000, when: "Apr 2027", conf: "High" },
      { name: "United Saver", sub: "1 stop · IAH", now: 78000, later: 72000, when: "Oct 2026", conf: "Medium" },
    ],
    hotels: [
      { name: "Alvear Palace", sub: "5★ · per night", now: 52000, later: 31000, when: "Mar 2027", conf: "High" },
      { name: "Four Seasons BA", sub: "5★ · per night", now: 60000, later: 40000, when: "Apr 2027", conf: "High" },
      { name: "Palacio Duhau", sub: "5★ · per night", now: 46000, later: 47000, when: "Nov 2026", conf: "Low" },
    ],
  },
  {
    id: "beijing",
    city: "Beijing",
    country: "China",
    flag: "🇨🇳",
    lat: 39.9,
    lon: 116.4,
    blurb: "Autumn award windows are the cheapest of the year.",
    bestWindow: "Sep – Oct 2026",
    accent: "#FF6B6B",
    flights: [
      { name: "Air China Business", sub: "Business · Nonstop", now: 158000, later: 94000, when: "Oct 2026", conf: "High" },
      { name: "Hainan Economy", sub: "Nonstop · 13h", now: 70000, later: 52000, when: "Sep 2026", conf: "Medium" },
      { name: "United Saver", sub: "1 stop · SFO", now: 84000, later: 80000, when: "Jul 2026", conf: "Medium" },
    ],
    hotels: [
      { name: "Aman Summer Palace", sub: "5★ · per night", now: 92000, later: 60000, when: "Oct 2026", conf: "High" },
      { name: "Rosewood Beijing", sub: "5★ · per night", now: 58000, later: 42000, when: "Sep 2026", conf: "Medium" },
      { name: "The Peninsula Beijing", sub: "5★ · per night", now: 64000, later: 66000, when: "Dec 2026", conf: "Low" },
    ],
  },
  {
    id: "berlin",
    city: "Berlin",
    country: "Germany",
    flag: "🇩🇪",
    lat: 52.52,
    lon: 13.4,
    blurb: "A modest wait trims winter fares — not dramatically.",
    bestWindow: "Jan – Feb 2027",
    accent: "#9775FA",
    flights: [
      { name: "Lufthansa Business", sub: "Business · 1 stop", now: 118000, later: 96000, when: "Jan 2027", conf: "Medium" },
      { name: "United Economy", sub: "Nonstop · 8h", now: 52000, later: 48000, when: "Feb 2027", conf: "High" },
      { name: "Air France", sub: "1 stop · CDG", now: 56000, later: 55000, when: "Nov 2026", conf: "Medium" },
    ],
    hotels: [
      { name: "Hotel Adlon Kempinski", sub: "5★ · per night", now: 60000, later: 49000, when: "Jan 2027", conf: "Medium" },
      { name: "Das Stue", sub: "5★ · per night", now: 44000, later: 39000, when: "Feb 2027", conf: "High" },
      { name: "Soho House Berlin", sub: "4★ · per night", now: 36000, later: 37000, when: "Dec 2026", conf: "Low" },
    ],
  },
  {
    id: "miami",
    city: "Miami",
    country: "USA",
    flag: "🇺🇸",
    lat: 25.76,
    lon: -80.19,
    blurb: "Season is heating up — prices only climb from here.",
    bestWindow: "Book now",
    accent: "#FF8787",
    flights: [
      { name: "American First", sub: "First · Nonstop", now: 50000, later: 58000, when: "Dec 2026", conf: "High" },
      { name: "JetBlue", sub: "Nonstop · 3h", now: 22000, later: 26000, when: "Nov 2026", conf: "High" },
      { name: "Delta Economy", sub: "Nonstop · 3h", now: 24000, later: 23000, when: "Mar 2027", conf: "Medium" },
    ],
    hotels: [
      { name: "Faena Hotel Miami Beach", sub: "5★ · per night", now: 62000, later: 71000, when: "Dec 2026", conf: "High" },
      { name: "The Setai", sub: "5★ · per night", now: 70000, later: 78000, when: "Jan 2027", conf: "Medium" },
      { name: "1 Hotel South Beach", sub: "5★ · per night", now: 48000, later: 53000, when: "Nov 2026", conf: "Medium" },
    ],
  },
  {
    id: "vancouver",
    city: "Vancouver",
    country: "Canada",
    flag: "🇨🇦",
    lat: 49.28,
    lon: -123.12,
    blurb: "Spring shoulder fares are the sweet spot here.",
    bestWindow: "Apr – May 2027",
    accent: "#3BC9DB",
    flights: [
      { name: "Air Canada Signature", sub: "Business · Nonstop", now: 90000, later: 64000, when: "Apr 2027", conf: "High" },
      { name: "WestJet Economy", sub: "Nonstop · 5h", now: 30000, later: 25000, when: "May 2027", conf: "High" },
      { name: "Alaska Saver", sub: "Nonstop · 4h", now: 28000, later: 29000, when: "Aug 2026", conf: "Medium" },
    ],
    hotels: [
      { name: "Fairmont Pacific Rim", sub: "5★ · per night", now: 64000, later: 44000, when: "Apr 2027", conf: "High" },
      { name: "Rosewood Hotel Georgia", sub: "5★ · per night", now: 52000, later: 38000, when: "May 2027", conf: "Medium" },
      { name: "Shangri-La Vancouver", sub: "5★ · per night", now: 46000, later: 47000, when: "Dec 2026", conf: "Low" },
    ],
  },
  {
    id: "toronto",
    city: "Toronto",
    country: "Canada",
    flag: "🇨🇦",
    lat: 43.65,
    lon: -79.38,
    blurb: "Prices hold steady — only small upside to waiting.",
    bestWindow: "Sep – Oct 2026",
    accent: "#748FFC",
    flights: [
      { name: "Air Canada Signature", sub: "Business · Nonstop", now: 75000, later: 60000, when: "Oct 2026", conf: "Medium" },
      { name: "Porter Economy", sub: "Nonstop · 1.5h", now: 18000, later: 17000, when: "Sep 2026", conf: "High" },
      { name: "United Economy", sub: "Nonstop · 2h", now: 22000, later: 23000, when: "Nov 2026", conf: "Medium" },
    ],
    hotels: [
      { name: "The St. Regis Toronto", sub: "5★ · per night", now: 58000, later: 46000, when: "Oct 2026", conf: "Medium" },
      { name: "Four Seasons Toronto", sub: "5★ · per night", now: 64000, later: 52000, when: "Sep 2026", conf: "High" },
      { name: "The Hazelton", sub: "5★ · per night", now: 42000, later: 43000, when: "Dec 2026", conf: "Low" },
    ],
  },
  {
    id: "melbourne",
    city: "Melbourne",
    country: "Australia",
    flag: "🇦🇺",
    lat: -37.81,
    lon: 144.96,
    blurb: "Off-peak award space drops hard after summer.",
    bestWindow: "May – Jul 2027",
    accent: "#20C997",
    flights: [
      { name: "Qantas Business", sub: "Business · 1 stop", now: 185000, later: 104000, when: "Jun 2027", conf: "High" },
      { name: "United Economy", sub: "1 stop · SFO", now: 88000, later: 60000, when: "May 2027", conf: "High" },
      { name: "Fiji Airways", sub: "1 stop · NAN", now: 96000, later: 90000, when: "Oct 2026", conf: "Medium" },
    ],
    hotels: [
      { name: "Park Hyatt Melbourne", sub: "5★ · per night", now: 70000, later: 42000, when: "Jun 2027", conf: "High" },
      { name: "The Langham Melbourne", sub: "5★ · per night", now: 54000, later: 36000, when: "May 2027", conf: "High" },
      { name: "W Melbourne", sub: "5★ · per night", now: 48000, later: 49000, when: "Dec 2026", conf: "Low" },
    ],
  },
];

// Verdict thresholds — pct saved by waiting.
export function verdictFor(now: number, later: number): Verdict {
  const save = now - later;
  const pct = save / now;
  if (pct >= 0.25) return { key: "wait-strong", label: "Wait & save", tone: "save", pct, save };
  if (pct >= 0.1) return { key: "wait", label: "Lean wait", tone: "save", pct, save };
  if (pct > -0.04) return { key: "tossup", label: "Toss-up", tone: "neutral", pct, save };
  return { key: "now", label: "Book now", tone: "now", pct, save };
}

// Aggregate a destination-level recommendation from the overall trend.
export function summarize(dest: Destination): Summary {
  const all = [...dest.flights, ...dest.hotels].map((o) => ({ o, v: verdictFor(o.now, o.later) }));
  const totalNow = all.reduce((s, x) => s + x.o.now, 0);
  const totalLater = all.reduce((s, x) => s + x.o.later, 0);
  const netPct = (totalNow - totalLater) / totalNow;
  let tone: Tone;
  let feature: { o: Offer; v: Verdict };
  if (netPct >= 0.1) {
    tone = "save";
    feature = all.reduce((a, b) => (b.v.save > a.v.save ? b : a)); // biggest saver
  } else if (netPct <= -0.02) {
    tone = "now";
    feature = all.reduce((a, b) => (b.v.save < a.v.save ? b : a)); // biggest riser
  } else {
    tone = "neutral";
    feature = all.reduce((a, b) => (b.v.save > a.v.save ? b : a));
  }
  return { best: feature, maxSave: feature.v.save, maxPct: feature.v.pct, netPct, window: feature.o.when, tone };
}

export const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
