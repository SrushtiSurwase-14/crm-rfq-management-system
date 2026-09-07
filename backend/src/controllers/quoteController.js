const { Quote, QuoteItem, Product, Customer, RFQ } = require('../models');

const fullInclude = [
  { model: Customer, as: 'customer' },
  { model: RFQ, as: 'rfq' },
  { model: QuoteItem, as: 'items', include: [{ model: Product, as: 'product' }] },
];

exports.list = async (req, res) => {
  const where = {};
  if (req.query.status) where.status = req.query.status;
  const quotes = await Quote.findAll({ where, include: fullInclude, order: [['created_at', 'DESC']] });
  res.json({ quotes });
};

exports.get = async (req, res) => {
  const quote = await Quote.findByPk(req.params.id, { include: fullInclude });
  if (!quote) return res.status(404).json({ error: 'Quote not found' });
  res.json({ quote });
};

// Reviewer can tweak quantity/unit price on a line before approving.
exports.updateItem = async (req, res) => {
  const quote = await Quote.findByPk(req.params.id);
  if (!quote) return res.status(404).json({ error: 'Quote not found' });
  if (quote.status !== 'pending_approval' && quote.status !== 'draft') {
    return res.status(400).json({ error: `Cannot edit a quote that is already ${quote.status}` });
  }

  const item = await QuoteItem.findOne({ where: { id: req.params.itemId, quote_id: quote.id } });
  if (!item) return res.status(404).json({ error: 'Quote item not found' });

  const { quantity, unit_price } = req.body;
  if (quantity !== undefined) item.quantity = quantity;
  if (unit_price !== undefined) item.unit_price = unit_price;
  item.line_total = Number((item.quantity * item.unit_price).toFixed(2));
  await item.save();

  const items = await QuoteItem.findAll({ where: { quote_id: quote.id } });
  const total = items.reduce((sum, i) => sum + i.line_total, 0);
  quote.total_amount = Number(total.toFixed(2));
  await quote.save();

  res.json({ item, total_amount: quote.total_amount });
};

// HITL checkpoint: reviewer approves -> quote (and RFQ) marked approved, then
// auto-"sent" back on the originating channel (simulated by status = sent).
exports.approve = async (req, res) => {
  const quote = await Quote.findByPk(req.params.id, { include: [{ model: RFQ, as: 'rfq' }] });
  if (!quote) return res.status(404).json({ error: 'Quote not found' });
  if (quote.status === 'approved' || quote.status === 'sent') {
    return res.status(400).json({ error: 'Quote has already been approved' });
  }

  quote.status = 'sent'; // approved + auto-sent back to client on same channel
  quote.reviewed_by = req.user.id;
  quote.reviewed_at = new Date();
  quote.review_notes = req.body.review_notes || null;
  await quote.save();

  if (quote.rfq) {
    quote.rfq.status = 'approved';
    await quote.rfq.save();
  }

  res.json({
    quote,
    message: `Quote #${quote.id} approved and sent back to the client on the originating channel.`,
  });
};

exports.reject = async (req, res) => {
  const quote = await Quote.findByPk(req.params.id, { include: [{ model: RFQ, as: 'rfq' }] });
  if (!quote) return res.status(404).json({ error: 'Quote not found' });

  quote.status = 'rejected';
  quote.reviewed_by = req.user.id;
  quote.reviewed_at = new Date();
  quote.review_notes = req.body.review_notes || 'Rejected by reviewer';
  await quote.save();

  if (quote.rfq) {
    quote.rfq.status = 'rejected';
    await quote.rfq.save();
  }

  res.json({ quote });
};
