/**
 * extractionService.js
 * ---------------------
 * Simulates the "RFQ Detection & Extraction" bot described in the sprint note.
 * In production this step would typically be an LLM call (e.g. Claude / GPT) with
 * a structured-output prompt, but for this assignment we use transparent,
 * deterministic rule-based parsing (regex + keyword heuristics) so the logic
 * is easy to inspect, test and demo without any external API key.
 *
 * The service intentionally keeps each rule small and named, so it doubles as
 * documentation of the extraction approach for the write-up / demo.
 */

// Keywords that suggest the email is asking for pricing/availability (i.e. an RFQ)
const RFQ_KEYWORDS = [
  'quote', 'quotation', 'rfq', 'price', 'pricing', 'rate', 'cost',
  'require', 'requirement', 'need', 'send us', 'kindly share',
  'availability', 'supply', 'purchase order', 'inquiry', 'enquiry',
];

// Unit words we recognise after a quantity number
const UNIT_WORDS = [
  'kg', 'kgs', 'g', 'gm', 'gms', 'gram', 'grams', 'mt', 'ton', 'tons', 'tonne', 'tonnes',
  'l', 'ltr', 'ltrs', 'litre', 'litres', 'liter', 'liters', 'ml',
  'units', 'unit', 'pcs', 'pieces', 'drums', 'drum', 'bags', 'bag', 'boxes', 'box',
];

const CAS_REGEX = /\b\d{2,7}-\d{2}-\d\b/g;

// Matches things like "500kg", "500 kg", "2.5 MT", "100 Units"
const QTY_UNIT_REGEX = new RegExp(
  `\\b(\\d+(?:\\.\\d+)?)\\s*(${UNIT_WORDS.join('|')})\\b`,
  'i'
);

// Lines that are just boilerplate / signature noise and should be skipped
const NOISE_LINE_REGEX = /^(dear|hi|hello|regards|thanks|thank you|best|sincerely|sent from|--|from:|to:|subject:|cc:|date:)/i;

/**
 * Extracts a probable sender email address and company from the raw text/subject,
 * used as a fallback when the RFQ isn't linked to an existing lead/customer.
 */
function extractSenderInfo(rawBody) {
  const emailMatch = rawBody.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return {
    email: emailMatch ? emailMatch[0] : null,
  };
}

/**
 * Decide whether the email text looks like an RFQ, with a naive confidence score.
 * Confidence = (keyword hits scaled) capped at 0.95, floor 0.05.
 * This mirrors Sprint 2's "confidence threshold" concept, where a human reviews
 * borderline cases during the initial oversight window.
 */
function classifyRfq(subject, body) {
  const text = `${subject || ''} \n ${body || ''}`.toLowerCase();
  let hits = 0;
  for (const kw of RFQ_KEYWORDS) {
    if (text.includes(kw)) hits += 1;
  }
  const hasQtyPattern = QTY_UNIT_REGEX.test(text);
  if (hasQtyPattern) hits += 2;

  const confidence = Math.min(0.95, Math.max(0.05, hits / 8));
  const is_rfq = confidence >= 0.35; // demo threshold

  return { is_rfq, confidence: Number(confidence.toFixed(2)) };
}

/**
 * Splits an email body into "line item candidate" fragments and pulls out
 * quantity + unit + free-text product description from each.
 *
 * Handles two common real-world styles:
 *   1. One product per line, e.g.:
 *        "Sodium Benzoate - 500 kg"
 *        "2 MT of Citric Acid Anhydrous"
 *   2. Comma / semicolon separated list within a paragraph, e.g.:
 *        "We require Sodium Benzoate 500kg, Citric Acid 2 MT and Potassium Sorbate 100kg"
 */
function extractLineItemCandidates(body) {
  if (!body) return [];

  // Normalise line breaks, then also split long paragraphs on common separators
  const roughLines = body
    .split(/\r?\n/)
    .flatMap((line) => line.split(/(?:,|;| and )+/i))
    .map((l) => l.trim())
    .filter(Boolean);

  const candidates = [];

  for (const line of roughLines) {
    if (NOISE_LINE_REGEX.test(line)) continue;
    if (line.length < 3) continue;

    const qtyMatch = line.match(QTY_UNIT_REGEX);
    const casMatches = line.match(CAS_REGEX);

    // Only treat as a candidate line item if it has a quantity+unit OR a CAS number
    // (otherwise it's likely just prose / greeting / sign-off).
    if (!qtyMatch && !casMatches) continue;

    let quantity = null;
    let unit = null;
    if (qtyMatch) {
      quantity = parseFloat(qtyMatch[1]);
      unit = qtyMatch[2].toLowerCase();
    }

    // Strip the quantity/unit phrase and common filler words to isolate the product text
    let productText = line
      .replace(QTY_UNIT_REGEX, ' ')
      .replace(/\bof\b/gi, ' ')
      .replace(/[-–:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    candidates.push({
      raw_text: line,
      product_text: productText || line,
      cas_number: casMatches ? casMatches[0] : null,
      requested_quantity: quantity,
      unit,
    });
  }

  return candidates;
}

/**
 * Top-level extraction entry point used by the controller.
 */
function extractRfqDetails({ subject, body }) {
  const classification = classifyRfq(subject, body);
  const sender = extractSenderInfo(body);
  const lineItems = extractLineItemCandidates(body);

  return {
    ...classification,
    sender,
    lineItems,
  };
}

module.exports = {
  classifyRfq,
  extractSenderInfo,
  extractLineItemCandidates,
  extractRfqDetails,
};
