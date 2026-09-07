/**
 * matchingService.js
 * -------------------
 * Matches a free-text product description (pulled from an RFQ email) against
 * the Product catalog, and checks the matched product's stock level.
 *
 * Matching strategy (simple + explainable, good for a technical assignment demo):
 *   1. Exact CAS number match -> confidence 1.0 (CAS numbers are unambiguous identifiers)
 *   2. Exact (case-insensitive) name/alias match -> confidence 0.95
 *   3. Token (word) overlap score between the RFQ text and product name/aliases,
 *      using a Jaccard-like similarity -> confidence 0..0.9
 * A product is only considered "matched" if confidence >= MATCH_THRESHOLD.
 */

const { Product, Inventory } = require('../models');
const { Op } = require('sequelize');

const MATCH_THRESHOLD = 0.35;

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(str) {
  return new Set(normalize(str).split(' ').filter((t) => t.length > 1));
}

function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Finds the best-matching active product for a given RFQ line item.
 * Returns { product, confidence } or { product: null, confidence: 0 }.
 */
async function matchProduct({ productText, casNumber }) {
  const products = await Product.findAll({ where: { is_active: true } });

  // 1. Exact CAS match
  if (casNumber) {
    const casHit = products.find((p) => p.cas_number && p.cas_number === casNumber);
    if (casHit) return { product: casHit, confidence: 1.0 };
  }

  const queryTokens = tokenSet(productText);
  const normalizedQuery = normalize(productText);

  let best = { product: null, confidence: 0 };

  for (const product of products) {
    const namesToCheck = [product.name, ...(product.aliases ? product.aliases.split(',') : [])];

    for (const candidateName of namesToCheck) {
      const normalizedCandidate = normalize(candidateName);
      if (!normalizedCandidate) continue;

      // Exact match (ignoring case/punctuation)
      if (normalizedCandidate === normalizedQuery) {
        return { product, confidence: 0.95 };
      }

      // Substring containment (either direction) is a strong signal
      let score;
      if (normalizedQuery.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedQuery)) {
        score = 0.85;
      } else {
        score = jaccardSimilarity(queryTokens, tokenSet(candidateName)) * 0.9;
      }

      if (score > best.confidence) {
        best = { product, confidence: Number(score.toFixed(2)) };
      }
    }
  }

  if (best.confidence < MATCH_THRESHOLD) {
    return { product: null, confidence: best.confidence };
  }
  return best;
}

/**
 * Checks whether the requested quantity is available in stock for a product.
 */
async function checkInventory(productId, requestedQuantity) {
  const inventory = await Inventory.findOne({ where: { product_id: productId } });
  const available = inventory ? inventory.quantity_available : 0;
  const qty = requestedQuantity || 0;
  return {
    available_stock: available,
    in_stock: available >= qty,
    shortfall: Math.max(0, qty - available),
  };
}

module.exports = {
  MATCH_THRESHOLD,
  matchProduct,
  checkInventory,
  normalize,
};
