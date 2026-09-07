const { RFQ, RFQItem, Customer, Lead, Product } = require('../models');
const { extractRfqDetails } = require('../services/extractionService');
const { matchProduct, checkInventory } = require('../services/matchingService');
const { generateQuoteForRfq } = require('../services/quoteService');

const fullInclude = [
  { model: Customer, as: 'customer' },
  { model: Lead, as: 'lead' },
  {
    model: RFQItem,
    as: 'items',
    include: [{ model: Product, as: 'matchedProduct' }],
  },
];

exports.list = async (req, res) => {
  const where = {};
  if (req.query.status) where.status = req.query.status;
  const rfqs = await RFQ.findAll({ where, include: fullInclude, order: [['created_at', 'DESC']] });
  res.json({ rfqs });
};

exports.get = async (req, res) => {
  const rfq = await RFQ.findByPk(req.params.id, { include: fullInclude });
  if (!rfq) return res.status(404).json({ error: 'RFQ not found' });
  res.json({ rfq });
};

/**
 * Core "live demo" endpoint: simulates an inbound email (or a manually pasted
 * RFQ) hitting the sales inbox. Runs classification + extraction + product
 * matching + inventory check in one pass, mirroring Sprint 2's workflow steps 1-4.
 */
exports.simulateIntake = async (req, res) => {
  try {
    const { subject, body, sender_email, customer_id, lead_id, source_channel } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Email body text is required' });
    }

    // Resolve customer: use provided customer_id, or try to match by extracted sender email,
    // otherwise leave unresolved (Reviewer can link it manually in the demo/UI).
    let customer = null;
    if (customer_id) {
      customer = await Customer.findByPk(customer_id);
      if (!customer) return res.status(400).json({ error: 'customer_id does not reference an existing customer' });
    }

    const extraction = extractRfqDetails({ subject, body });
    const resolvedSenderEmail = sender_email || extraction.sender.email;

    if (!customer && resolvedSenderEmail) {
      customer = await Customer.findOne({ where: { email: resolvedSenderEmail } });
    }

    const rfq = await RFQ.create({
      lead_id: lead_id || null,
      customer_id: customer ? customer.id : null,
      source_channel: source_channel || 'email',
      sender_email: resolvedSenderEmail || null,
      subject: subject || null,
      raw_body: body,
      is_rfq: extraction.is_rfq,
      confidence_score: extraction.confidence,
      status: extraction.is_rfq ? 'extracted' : 'not_rfq',
      created_by: req.user ? req.user.id : null,
    });

    const items = [];
    for (const candidate of extraction.lineItems) {
      const { product, confidence } = await matchProduct({
        productText: candidate.product_text,
        casNumber: candidate.cas_number,
      });

      const item = await RFQItem.create({
        rfq_id: rfq.id,
        raw_text: candidate.raw_text,
        matched_product_id: product ? product.id : null,
        match_confidence: confidence,
        requested_quantity: candidate.requested_quantity,
        unit: candidate.unit,
        is_trading_item: false,
      });
      items.push(item);
    }

    const fullRfq = await RFQ.findByPk(rfq.id, { include: fullInclude });
    res.status(201).json({
      rfq: fullRfq,
      extraction_summary: {
        is_rfq: extraction.is_rfq,
        confidence: extraction.confidence,
        line_items_found: extraction.lineItems.length,
        line_items_matched: items.filter((i) => i.matched_product_id).length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Lets a reviewer/sales user correct a mis-matched or unmatched line item
 * before a quote is generated (e.g. picking the right product manually).
 */
exports.updateItem = async (req, res) => {
  const item = await RFQItem.findOne({ where: { id: req.params.itemId, rfq_id: req.params.id } });
  if (!item) return res.status(404).json({ error: 'RFQ item not found' });

  const { matched_product_id, requested_quantity, unit, is_trading_item } = req.body;

  if (matched_product_id !== undefined) {
    if (matched_product_id !== null) {
      const product = await Product.findByPk(matched_product_id);
      if (!product) return res.status(400).json({ error: 'matched_product_id does not reference an existing product' });
    }
    item.matched_product_id = matched_product_id;
    item.match_confidence = matched_product_id ? 1.0 : null; // manual match = full confidence
  }
  if (requested_quantity !== undefined) item.requested_quantity = requested_quantity;
  if (unit !== undefined) item.unit = unit;
  if (is_trading_item !== undefined) item.is_trading_item = is_trading_item;

  await item.save();
  res.json({ item });
};

/**
 * Returns a live inventory-check preview for every matched item on the RFQ,
 * without creating a quote yet - useful for the UI before committing to Step 5/6.
 */
exports.inventoryPreview = async (req, res) => {
  const rfq = await RFQ.findByPk(req.params.id, { include: fullInclude });
  if (!rfq) return res.status(404).json({ error: 'RFQ not found' });

  const preview = [];
  for (const item of rfq.items) {
    if (!item.matched_product_id) {
      preview.push({ item_id: item.id, matched: false });
      continue;
    }
    const stock = await checkInventory(item.matched_product_id, item.requested_quantity);
    preview.push({ item_id: item.id, matched: true, product: item.matchedProduct, ...stock });
  }
  res.json({ preview });
};

/**
 * Generates a draft quote from the RFQ's currently-matched line items
 * (Sprint 2 steps 4-5) and puts it into pending_approval status (step 6).
 */
exports.generateQuote = async (req, res) => {
  try {
    const rfq = await RFQ.findByPk(req.params.id);
    if (!rfq) return res.status(404).json({ error: 'RFQ not found' });
    if (!rfq.customer_id) {
      return res.status(400).json({ error: 'RFQ must be linked to a customer before a quote can be generated' });
    }

    const quote = await generateQuoteForRfq(rfq);
    rfq.status = 'pending_approval';
    await rfq.save();

    res.status(201).json({ quote });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const rfq = await RFQ.findByPk(req.params.id);
    if (!rfq) return res.status(404).json({ error: 'RFQ not found' });
    const { customer_id, status, subject } = req.body;
    if (customer_id !== undefined) {
      if (customer_id) {
        const customer = await Customer.findByPk(customer_id);
        if (!customer) return res.status(400).json({ error: 'Customer not found' });
        rfq.customer_id = customer.id;
      } else {
        rfq.customer_id = null;
      }
    }
    if (status !== undefined) rfq.status = status;
    if (subject !== undefined) rfq.subject = subject;
    await rfq.save();
    const fullRfq = await RFQ.findByPk(rfq.id, { include: fullInclude });
    res.json({ rfq: fullRfq });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addItem = async (req, res) => {
  try {
    const rfq = await RFQ.findByPk(req.params.id);
    if (!rfq) return res.status(404).json({ error: 'RFQ not found' });
    const { raw_text, matched_product_id, requested_quantity, unit } = req.body;
    const item = await RFQItem.create({
      rfq_id: rfq.id,
      raw_text: raw_text || 'Manual item',
      matched_product_id: matched_product_id ? Number(matched_product_id) : null,
      match_confidence: matched_product_id ? 1.0 : null,
      requested_quantity: requested_quantity ? Number(requested_quantity) : 100,
      unit: unit || 'kg',
      is_trading_item: false,
    });
    const fullItem = await RFQItem.findByPk(item.id, {
      include: [{ model: Product, as: 'matchedProduct' }],
    });
    res.status(201).json({ item: fullItem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const item = await RFQItem.findOne({ where: { id: req.params.itemId, rfq_id: req.params.id } });
    if (!item) return res.status(404).json({ error: 'RFQ item not found' });
    await item.destroy();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  const rfq = await RFQ.findByPk(req.params.id);
  if (!rfq) return res.status(404).json({ error: 'RFQ not found' });
  await rfq.destroy();
  res.status(204).send();
};
