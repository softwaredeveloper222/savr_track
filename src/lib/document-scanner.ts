import { CATEGORY_KEYWORDS, parseDocument } from "./document-parser";

interface ScanResult {
  extractedTitle: string | null;
  extractedCategory: string | null;
  extractedExpDate: string | null;
  extractedText: string;
  confidence: "high" | "medium" | "low";
}

// Date patterns to find in extracted text content
const TEXT_DATE_PATTERNS = [
  // "Expiration Date: MM/DD/YYYY" or "Exp: ..."
  { regex: /(?:expir(?:ation|es?|y)|exp\.?\s*date|valid\s*(?:until|thru|through|to)|effective\s*(?:until|thru|through|to)|end\s*date|renewal\s*date)[:\s]*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/gi, parse: (m: RegExpMatchArray) => parseMMDDYYYY(m[1], m[2], m[3]) },
  // "Expiration Date: YYYY-MM-DD"
  { regex: /(?:expir(?:ation|es?|y)|exp\.?\s*date|valid\s*(?:until|thru|through|to)|end\s*date|renewal\s*date)[:\s]*(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/gi, parse: (m: RegExpMatchArray) => parseYYYYMMDD(m[1], m[2], m[3]) },
  // "Expiration Date: Month DD, YYYY"
  { regex: /(?:expir(?:ation|es?|y)|exp\.?\s*date|valid\s*(?:until|thru|through|to)|end\s*date|renewal\s*date)[:\s]*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2}),?\s*(\d{4})/gi, parse: (m: RegExpMatchArray) => parseMonthDDYYYY(m[1], m[2], m[3]) },
  // Standalone dates near "expire" context (looser match)
  { regex: /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g, parse: (m: RegExpMatchArray) => parseMMDDYYYY(m[1], m[2], m[3]) },
];

// Document type patterns in text content
const DOC_TYPE_PATTERNS: { regex: RegExp; category: string; titleHint: string }[] = [
  { regex: /certificate\s+of\s+(?:liability\s+)?insurance/i, category: "coi", titleHint: "Certificate of Insurance" },
  { regex: /general\s+liability/i, category: "insurance", titleHint: "General Liability Insurance" },
  { regex: /workers?\s*(?:'s?)?\s*comp(?:ensation)?/i, category: "insurance", titleHint: "Workers Compensation" },
  { regex: /professional\s+liability/i, category: "insurance", titleHint: "Professional Liability Insurance" },
  { regex: /commercial\s+auto/i, category: "insurance", titleHint: "Commercial Auto Insurance" },
  { regex: /umbrella\s+(?:liability|policy)/i, category: "insurance", titleHint: "Umbrella Liability Policy" },
  { regex: /surety\s+bond/i, category: "insurance", titleHint: "Surety Bond" },
  { regex: /contractor(?:'?s?)?\s+license/i, category: "trade_license", titleHint: "Contractor License" },
  { regex: /(?:electrical|plumbing|hvac|mechanical)\s+license/i, category: "trade_license", titleHint: "Trade License" },
  { regex: /business\s+license/i, category: "business_license", titleHint: "Business License" },
  { regex: /building\s+permit/i, category: "permit", titleHint: "Building Permit" },
  { regex: /(?:osha|safety)\s+(?:certification|training|card)/i, category: "safety_training", titleHint: "Safety Certification" },
  { regex: /epa\s+(?:certification|license)/i, category: "certification", titleHint: "EPA Certification" },
  { regex: /inspection\s+(?:report|certificate)/i, category: "inspection", titleHint: "Inspection Report" },
];

function parseMMDDYYYY(m: string, d: string, y: string): string | null {
  const year = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
  const month = parseInt(m);
  const day = parseInt(d);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2020 || year > 2035) return null;
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split("T")[0];
}

function parseYYYYMMDD(y: string, m: string, d: string): string | null {
  return parseMMDDYYYY(m, d, y);
}

function parseMonthDDYYYY(monthStr: string, d: string, y: string): string | null {
  const months: Record<string, number> = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
    apr: 4, april: 4, may: 5, jun: 6, june: 6,
    jul: 7, july: 7, aug: 8, august: 8, sep: 9, september: 9,
    oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
  };
  const month = months[monthStr.toLowerCase()];
  if (!month) return null;
  return parseMMDDYYYY(String(month), d, y);
}

function extractExpirationDate(text: string): string | null {
  // Try patterns with expiration context first (more reliable)
  for (let i = 0; i < TEXT_DATE_PATTERNS.length - 1; i++) {
    const pattern = TEXT_DATE_PATTERNS[i];
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      const date = pattern.parse(match);
      if (date) return date;
    }
  }

  // Fallback: find all standalone dates and pick the latest future date
  const lastPattern = TEXT_DATE_PATTERNS[TEXT_DATE_PATTERNS.length - 1];
  const regex = new RegExp(lastPattern.regex.source, lastPattern.regex.flags);
  let match;
  const dates: string[] = [];
  while ((match = regex.exec(text)) !== null) {
    const date = lastPattern.parse(match);
    if (date) dates.push(date);
  }

  if (dates.length > 0) {
    // Pick the latest date that's in the future (likely expiration)
    const now = new Date().toISOString().split("T")[0];
    const futureDates = dates.filter((d) => d > now);
    if (futureDates.length > 0) {
      return futureDates.sort().pop()!;
    }
    // If no future dates, pick the latest
    return dates.sort().pop()!;
  }

  return null;
}

function extractDocType(text: string): { category: string; title: string } | null {
  for (const pattern of DOC_TYPE_PATTERNS) {
    if (pattern.regex.test(text)) {
      return { category: pattern.category, title: pattern.titleHint };
    }
  }

  // Fallback: use keyword matching from document-parser
  const lower = text.toLowerCase();
  let bestCategory: string | null = null;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        score += keyword.split(" ").length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory ? { category: bestCategory, title: bestCategory.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) } : null;
}

export async function scanDocumentContent(
  filePath: string,
  mimeType: string,
  originalName: string
): Promise<ScanResult> {
  let extractedText = "";

  try {
    // Extract text from PDF
    if (mimeType === "application/pdf") {
      const fs = await import("fs");
      const buffer = fs.readFileSync(filePath);
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(buffer);
      extractedText = data.text || "";
    }
    // For images, we can't do OCR without a heavy dependency
    // Fall back to filename-only parsing for images
  } catch (error) {
    console.error("Document scan error:", error);
    // Fall through to filename-only parsing
  }

  // Combine filename analysis + content analysis
  const filenameParsed = parseDocument(originalName);

  if (!extractedText.trim()) {
    // No text extracted — use filename-only results
    return {
      extractedTitle: filenameParsed.suggestedTitle,
      extractedCategory: filenameParsed.suggestedCategory,
      extractedExpDate: filenameParsed.suggestedExpirationDate,
      extractedText: "",
      confidence: filenameParsed.confidence,
    };
  }

  // Content-based extraction
  const contentExpDate = extractExpirationDate(extractedText);
  const contentDocType = extractDocType(extractedText);

  // Merge: prefer content extraction, fall back to filename
  const expDate = contentExpDate || filenameParsed.suggestedExpirationDate;
  const category = contentDocType?.category || filenameParsed.suggestedCategory;
  const title = contentDocType?.title || filenameParsed.suggestedTitle;

  // Calculate confidence
  let confidence: "high" | "medium" | "low" = "low";
  const signals = [
    contentExpDate ? 1 : 0,
    contentDocType ? 1 : 0,
    filenameParsed.suggestedCategory ? 0.5 : 0,
    filenameParsed.suggestedExpirationDate ? 0.5 : 0,
  ];
  const score = signals.reduce((a, b) => a + b, 0);
  if (score >= 2) confidence = "high";
  else if (score >= 1) confidence = "medium";

  return {
    extractedTitle: title,
    extractedCategory: category,
    extractedExpDate: expDate,
    extractedText: extractedText.slice(0, 500), // store first 500 chars for reference
    confidence,
  };
}

// Re-export for use in document-scanner
export { CATEGORY_KEYWORDS };
