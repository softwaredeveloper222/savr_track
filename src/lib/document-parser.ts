import { CATEGORIES } from "./categories";

interface ParsedDocument {
  suggestedTitle: string;
  suggestedCategory: string | null;
  suggestedExpirationDate: string | null;
  confidence: "high" | "medium" | "low";
}

// Keywords that map to categories
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  insurance: [
    "insurance", "policy", "liability", "workers comp", "workers compensation",
    "bonding", "bond", "surety", "coverage", "underwriting", "premium",
    "coi", "certificate of insurance", "indemnity",
  ],
  trade_license: [
    "license", "licence", "electrician", "plumber", "plumbing", "hvac",
    "journeyman", "master", "contractor license", "trade license",
  ],
  business_license: [
    "business license", "business permit", "operating license", "llc",
    "business registration",
  ],
  certification: [
    "certification", "certificate", "certified", "epa", "nicet",
    "osha card", "credential",
  ],
  inspection: [
    "inspection", "inspect", "fire inspection", "building inspection",
    "code compliance",
  ],
  permit: [
    "permit", "building permit", "mechanical permit", "electrical permit",
    "plumbing permit", "zoning",
  ],
  safety_training: [
    "safety", "training", "osha", "hazmat", "first aid", "cpr",
    "fall protection", "arc flash",
  ],
  coi: [
    "coi", "certificate of insurance", "proof of insurance",
  ],
  tax: [
    "tax", "1099", "w-2", "w2", "irs", "filing", "return",
  ],
  filing: [
    "annual report", "annual filing", "secretary of state", "registered agent",
  ],
};

// Date patterns to detect in filenames
const DATE_PATTERNS = [
  // MM-DD-YYYY or MM/DD/YYYY
  { regex: /(\d{1,2})[-/](\d{1,2})[-/](\d{4})/, parse: (m: RegExpMatchArray) => new Date(+m[3], +m[1] - 1, +m[2]) },
  // YYYY-MM-DD
  { regex: /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/, parse: (m: RegExpMatchArray) => new Date(+m[1], +m[2] - 1, +m[3]) },
  // MMM DD YYYY or MMM-DD-YYYY (e.g., Jan 15 2025)
  { regex: /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*[\s-](\d{1,2})[\s,-]*(\d{4})/i, parse: (m: RegExpMatchArray) => {
    const months: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    const monthKey = m[1].toLowerCase().slice(0, 3);
    return new Date(+m[3], months[monthKey] || 0, +m[2]);
  }},
  // MMDDYYYY (8 digits)
  { regex: /(\d{2})(\d{2})(\d{4})/, parse: (m: RegExpMatchArray) => {
    const month = +m[1];
    const day = +m[2];
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(+m[3], month - 1, day);
    }
    return null;
  }},
  // Exp or Expires followed by date-like content
  { regex: /exp\w*[\s_-]*(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/i, parse: (m: RegExpMatchArray) => {
    const year = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    return new Date(year, +m[1] - 1, +m[2]);
  }},
];

function detectDate(filename: string): string | null {
  // Remove extension
  const name = filename.replace(/\.[^.]+$/, "");

  for (const pattern of DATE_PATTERNS) {
    const match = name.match(pattern.regex);
    if (match) {
      const date = pattern.parse(match);
      if (date && !isNaN(date.getTime()) && date.getFullYear() >= 2020 && date.getFullYear() <= 2035) {
        return date.toISOString().split("T")[0];
      }
    }
  }
  return null;
}

function detectCategory(filename: string): string | null {
  const lower = filename.toLowerCase().replace(/[_-]/g, " ");

  // Check COI first (more specific)
  for (const keyword of CATEGORY_KEYWORDS.coi) {
    if (lower.includes(keyword)) return "coi";
  }

  // Score each category
  let bestCategory: string | null = null;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === "coi") continue;
    let score = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        score += keyword.split(" ").length; // multi-word matches score higher
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestScore > 0 ? bestCategory : null;
}

function cleanTitle(filename: string): string {
  // Remove extension
  let name = filename.replace(/\.[^.]+$/, "");
  // Replace underscores and hyphens with spaces
  name = name.replace(/[_-]/g, " ");
  // Remove date-like patterns
  name = name.replace(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/g, "");
  name = name.replace(/\d{4}[-/]\d{1,2}[-/]\d{1,2}/g, "");
  name = name.replace(/\d{8}/g, "");
  // Remove UUIDs
  name = name.replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, "");
  // Clean up extra spaces
  name = name.replace(/\s+/g, " ").trim();
  // Title case
  name = name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return name || filename.replace(/\.[^.]+$/, "");
}

export function parseDocument(filename: string): ParsedDocument {
  const suggestedTitle = cleanTitle(filename);
  const suggestedCategory = detectCategory(filename);
  const suggestedExpirationDate = detectDate(filename);

  let confidence: "high" | "medium" | "low" = "low";
  if (suggestedCategory && suggestedExpirationDate) {
    confidence = "high";
  } else if (suggestedCategory || suggestedExpirationDate) {
    confidence = "medium";
  }

  return {
    suggestedTitle,
    suggestedCategory,
    suggestedExpirationDate,
    confidence,
  };
}

export function getCategoryLabelSafe(value: string | null): string {
  if (!value) return "Unknown";
  return CATEGORIES.find((c) => c.value === value)?.label || value;
}
