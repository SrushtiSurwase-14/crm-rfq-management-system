const { Quote, QuoteItem, RFQItem, Product, Inventory } = require('../models');

/**
 * Builds a draft Quote (+ QuoteItems) from an RFQ's matched line items.
 * Only RFQItems that have a matched_product_id are included as priced lines;
 * unmatched items are surfaced separately so the Reviewer can handle them manually.
 */
async function generateQuoteForRfq(rfq) {
  const rfqItems = await RFQItem.findAll({ where: { rfq_id: rfq.id } });

  const matchedItems = rfqItems.filter((i) => i.matched_product_id);
  if (matchedItems.length === 0) {
    throw new Error('Cannot generate a quote: no RFQ line items were matched to a product.');
  }

  let total = 0;
  const quoteItemsData = [];

  for (const item of matchedItems) {
    const product = await Product.findByPk(item.matched_product_id);
    const inventory = await Inventory.findOne({ where: { product_id: item.matched_product_id } });
    const availableStock = inventory ? inventory.quantity_available : 0;
    const quantity = item.requested_quantity || 0;
    const unitPrice = product.unit_price;
    const lineTotal = Number((quantity * unitPrice).toFixed(2));
    total += lineTotal;

    quoteItemsData.push({
      product_id: product.id,
      quantity,
      unit_price: unitPrice,
      available_stock_at_quote: availableStock,
      in_stock: availableStock >= quantity,
      line_total: lineTotal,
    });
  }

  const quote = await Quote.create({
    rfq_id: rfq.id,
    customer_id: rfq.customer_id,
    status: 'pending_approval',
    total_amount: Number(total.toFixed(2)),
  });

  for (const data of quoteItemsData) {
    await QuoteItem.create({ ...data, quote_id: quote.id });
  }

  return quote;
}

module.exports = { generateQuoteForRfq };
