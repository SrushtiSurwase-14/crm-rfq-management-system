/**
 * seedVercel.js
 * Lightweight in-process seeder for Vercel's in-memory SQLite.
 * Called automatically on cold start. Does NOT call process.exit().
 */
const bcrypt = require('bcryptjs');
const {
  User,
  Customer,
  Lead,
  Product,
  Inventory,
  RFQ,
  RFQItem,
  Quote,
  QuoteItem,
} = require('./models');

async function seedVercel() {
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const [admin, sales, reviewer] = await Promise.all([
    User.create({ name: 'Admin User', email: 'admin@demo.com', password_hash: passwordHash, role: 'admin' }),
    User.create({ name: 'Sales Rep', email: 'sales@demo.com', password_hash: passwordHash, role: 'sales' }),
    User.create({ name: 'Reviewer', email: 'reviewer@demo.com', password_hash: passwordHash, role: 'reviewer' }),
  ]);

  const customers = await Customer.bulkCreate([
    { name: 'Rakesh Sharma', company: 'Sharma Pharma Pvt Ltd', email: 'rakesh@sharmapharma.com', phone: '9876500001', territory: 'North' },
    { name: 'Anita Verma', company: 'Verma Chemicals', email: 'anita@vermachem.com', phone: '9876500002', territory: 'West' },
    { name: 'Global Ingredients Co', company: 'Global Ingredients Co', email: 'purchase@globalingredients.com', phone: '9876500003', territory: 'South' },
  ]);

  const productsData = [
    { name: 'Sodium Benzoate', cas_number: '532-32-1', category: 'Preservative', unit: 'kg', unit_price: 185, aliases: 'sod benzoate,na benzoate' },
    { name: 'Citric Acid Anhydrous', cas_number: '77-92-9', category: 'Acidulant', unit: 'kg', unit_price: 92, aliases: 'citric acid,anhydrous citric acid' },
    { name: 'Potassium Sorbate', cas_number: '24634-61-5', category: 'Preservative', unit: 'kg', unit_price: 310, aliases: 'k sorbate,pot sorbate' },
    { name: 'Xanthan Gum', cas_number: '11138-66-2', category: 'Stabilizer', unit: 'kg', unit_price: 540, aliases: 'xanthan' },
    { name: 'Ascorbic Acid', cas_number: '50-81-7', category: 'Vitamin', unit: 'kg', unit_price: 620, aliases: 'vitamin c,vit c' },
    { name: 'Titanium Dioxide', cas_number: '13463-67-7', category: 'Colorant', unit: 'kg', unit_price: 410, aliases: 'tio2' },
  ];

  const products = [];
  for (const p of productsData) {
    const product = await Product.create(p);
    products.push(product);
  }

  await Inventory.bulkCreate([
    { product_id: products[0].id, quantity_available: 1200, reorder_level: 200, warehouse_location: 'WH-A' },
    { product_id: products[1].id, quantity_available: 300, reorder_level: 100, warehouse_location: 'WH-A' },
    { product_id: products[2].id, quantity_available: 50, reorder_level: 80, warehouse_location: 'WH-B' },
    { product_id: products[3].id, quantity_available: 400, reorder_level: 50, warehouse_location: 'WH-B' },
    { product_id: products[4].id, quantity_available: 150, reorder_level: 50, warehouse_location: 'WH-A' },
    { product_id: products[5].id, quantity_available: 0, reorder_level: 100, warehouse_location: 'WH-C' },
  ]);

  await Lead.bulkCreate([
    { customer_id: customers[0].id, source: 'event', status: 'qualified', assigned_to: sales.id, category: 'Products', notes: 'Met at ChemExpo 2026' },
    { customer_id: customers[1].id, source: 'website_form', status: 'new', assigned_to: sales.id, category: 'COA Requests' },
    { customer_id: customers[2].id, source: 'campaign', status: 'contacted', assigned_to: sales.id, category: 'Products', notes: 'High-engagement Brevo segment' },
  ]);

  // Demo RFQ 1
  const rfq1 = await RFQ.create({
    customer_id: customers[0].id,
    source_channel: 'email',
    sender_email: 'rakesh@sharmapharma.com',
    subject: 'Request for Quotation - Preservatives & Stabilizers Batch 2026',
    raw_body: `Dear Sales Team,\n\nKindly share your best CIF quote for the following bulk requirement:\n- Sodium Benzoate: 500 kg\n- Citric Acid Anhydrous: 2000 kg\n- Xanthan Gum: 50 kg\n\nPlease include lead times and COA.\n\nRegards,\nRakesh Sharma\nSharma Pharma Pvt Ltd`,
    is_rfq: true,
    confidence_score: 0.95,
    status: 'pending_approval',
    created_by: sales.id,
  });

  await RFQItem.bulkCreate([
    { rfq_id: rfq1.id, raw_text: 'Sodium Benzoate: 500 kg', matched_product_id: products[0].id, match_confidence: 0.95, requested_quantity: 500, unit: 'kg', is_trading_item: false },
    { rfq_id: rfq1.id, raw_text: 'Citric Acid Anhydrous: 2000 kg', matched_product_id: products[1].id, match_confidence: 0.92, requested_quantity: 2000, unit: 'kg', is_trading_item: false },
    { rfq_id: rfq1.id, raw_text: 'Xanthan Gum: 50 kg', matched_product_id: products[3].id, match_confidence: 0.96, requested_quantity: 50, unit: 'kg', is_trading_item: false },
  ]);

  const quote1 = await Quote.create({
    rfq_id: rfq1.id,
    customer_id: customers[0].id,
    status: 'pending_approval',
    total_amount: 303500,
  });

  await QuoteItem.bulkCreate([
    { quote_id: quote1.id, product_id: products[0].id, quantity: 500, unit_price: 185, available_stock_at_quote: 1200, in_stock: true, line_total: 92500 },
    { quote_id: quote1.id, product_id: products[1].id, quantity: 2000, unit_price: 92, available_stock_at_quote: 300, in_stock: false, line_total: 184000 },
    { quote_id: quote1.id, product_id: products[3].id, quantity: 50, unit_price: 540, available_stock_at_quote: 400, in_stock: true, line_total: 27000 },
  ]);

  // Demo RFQ 2
  const rfq2 = await RFQ.create({
    customer_id: customers[1].id,
    source_channel: 'email',
    sender_email: 'anita@vermachem.com',
    subject: 'Urgent Pricing Requirement - Ascorbic Acid (CAS 50-81-7)',
    raw_body: `Hi Team,\n\nWe require an immediate commercial quote for Ascorbic Acid (CAS 50-81-7), quantity 75 kg, for our upcoming production batch.\n\nPlease send pricing and ETA to Mumbai warehouse.\n\nThanks,\nAnita Verma`,
    is_rfq: true,
    confidence_score: 0.92,
    status: 'extracted',
    created_by: sales.id,
  });

  await RFQItem.create({
    rfq_id: rfq2.id,
    raw_text: 'Ascorbic Acid (CAS 50-81-7), quantity 75 kg',
    matched_product_id: products[4].id,
    match_confidence: 0.98,
    requested_quantity: 75,
    unit: 'kg',
    is_trading_item: false,
  });

  console.log('Vercel seed complete — demo data loaded into in-memory SQLite.');
}

module.exports = seedVercel;
