/**
 * demoStore.js
 * In-memory fallback data store for demo/presentation on Vercel
 * when external PostgreSQL is not yet configured.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'crm_rfq_jwt_secret_fallback_key';

let customers = [
  { id: 1, name: 'Rakesh Sharma', company: 'Sharma Pharma Pvt Ltd', email: 'rakesh@sharmapharma.com', phone: '9876500001', territory: 'North' },
  { id: 2, name: 'Anita Verma', company: 'Verma Chemicals', email: 'anita@vermachem.com', phone: '9876500002', territory: 'West' },
  { id: 3, name: 'Global Ingredients Co', company: 'Global Ingredients Co', email: 'purchase@globalingredients.com', phone: '9876500003', territory: 'South' },
];

let products = [
  { id: 1, name: 'Sodium Benzoate', cas_number: '532-32-1', category: 'Preservative', unit: 'kg', unit_price: 185, aliases: 'sod benzoate,na benzoate', inventory: { quantity_available: 1200, reorder_level: 200, warehouse_location: 'WH-A' } },
  { id: 2, name: 'Citric Acid Anhydrous', cas_number: '77-92-9', category: 'Acidulant', unit: 'kg', unit_price: 92, aliases: 'citric acid,anhydrous citric acid', inventory: { quantity_available: 300, reorder_level: 100, warehouse_location: 'WH-A' } },
  { id: 3, name: 'Potassium Sorbate', cas_number: '24634-61-5', category: 'Preservative', unit: 'kg', unit_price: 310, aliases: 'k sorbate,pot sorbate', inventory: { quantity_available: 50, reorder_level: 80, warehouse_location: 'WH-B' } },
  { id: 4, name: 'Xanthan Gum', cas_number: '11138-66-2', category: 'Stabilizer', unit: 'kg', unit_price: 540, aliases: 'xanthan', inventory: { quantity_available: 400, reorder_level: 50, warehouse_location: 'WH-B' } },
  { id: 5, name: 'Ascorbic Acid', cas_number: '50-81-7', category: 'Vitamin', unit: 'kg', unit_price: 620, aliases: 'vitamin c,vit c', inventory: { quantity_available: 150, reorder_level: 50, warehouse_location: 'WH-A' } },
  { id: 6, name: 'Titanium Dioxide', cas_number: '13463-67-7', category: 'Colorant', unit: 'kg', unit_price: 410, aliases: 'tio2', inventory: { quantity_available: 0, reorder_level: 100, warehouse_location: 'WH-C' } },
];

let leads = [
  { id: 1, customer_id: 1, customer: customers[0], source: 'event', status: 'qualified', category: 'Products', notes: 'Met at ChemExpo 2026', created_at: new Date().toISOString() },
  { id: 2, customer_id: 2, customer: customers[1], source: 'website_form', status: 'new', category: 'COA Requests', notes: '', created_at: new Date().toISOString() },
  { id: 3, customer_id: 3, customer: customers[2], source: 'campaign', status: 'contacted', category: 'Products', notes: 'High-engagement Brevo segment', created_at: new Date().toISOString() },
];

let rfqs = [
  {
    id: 1,
    customer_id: 1,
    customer: customers[0],
    source_channel: 'email',
    sender_email: 'rakesh@sharmapharma.com',
    subject: 'Request for Quotation - Preservatives & Stabilizers Batch 2026',
    raw_body: 'Dear Sales Team,\n\nKindly share your best CIF quote for the following bulk requirement:\n- Sodium Benzoate: 500 kg\n- Citric Acid Anhydrous: 2000 kg\n- Xanthan Gum: 50 kg\n\nPlease include lead times and COA.\n\nRegards,\nRakesh Sharma\nSharma Pharma Pvt Ltd',
    is_rfq: true,
    confidence_score: 0.95,
    status: 'pending_approval',
    items: [
      { id: 1, rfq_id: 1, raw_text: 'Sodium Benzoate: 500 kg', matched_product_id: 1, match_confidence: 0.95, requested_quantity: 500, unit: 'kg', matchedProduct: products[0] },
      { id: 2, rfq_id: 1, raw_text: 'Citric Acid Anhydrous: 2000 kg', matched_product_id: 2, match_confidence: 0.92, requested_quantity: 2000, unit: 'kg', matchedProduct: products[1] },
      { id: 3, rfq_id: 1, raw_text: 'Xanthan Gum: 50 kg', matched_product_id: 4, match_confidence: 0.96, requested_quantity: 50, unit: 'kg', matchedProduct: products[3] },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    customer_id: 2,
    customer: customers[1],
    source_channel: 'email',
    sender_email: 'anita@vermachem.com',
    subject: 'Urgent Pricing Requirement - Ascorbic Acid (CAS 50-81-7)',
    raw_body: 'Hi Team,\n\nWe require an immediate commercial quote for Ascorbic Acid (CAS 50-81-7), quantity 75 kg, for our upcoming production batch.\n\nPlease send pricing and ETA to Mumbai warehouse.\n\nThanks,\nAnita Verma',
    is_rfq: true,
    confidence_score: 0.92,
    status: 'extracted',
    items: [
      { id: 4, rfq_id: 2, raw_text: 'Ascorbic Acid (CAS 50-81-7), quantity 75 kg', matched_product_id: 5, match_confidence: 0.98, requested_quantity: 75, unit: 'kg', matchedProduct: products[4] },
    ],
    created_at: new Date().toISOString(),
  },
];

let quotes = [
  {
    id: 1,
    rfq_id: 1,
    rfq: rfqs[0],
    customer_id: 1,
    customer: customers[0],
    status: 'pending_approval',
    total_amount: 303500,
    items: [
      { id: 1, quote_id: 1, product_id: 1, product: products[0], quantity: 500, unit_price: 185, available_stock_at_quote: 1200, in_stock: true, line_total: 92500 },
      { id: 2, quote_id: 1, product_id: 2, product: products[1], quantity: 2000, unit_price: 92, available_stock_at_quote: 300, in_stock: false, line_total: 184000 },
      { id: 3, quote_id: 1, product_id: 4, product: products[3], quantity: 50, unit_price: 540, available_stock_at_quote: 400, in_stock: true, line_total: 27000 },
    ],
    reviewer: { name: 'Reviewer' },
    created_at: new Date().toISOString(),
  },
];

const demoUsers = [
  { id: 1, name: 'Admin User', email: 'admin@demo.com', role: 'admin' },
  { id: 2, name: 'Sales Rep', email: 'sales@demo.com', role: 'sales' },
  { id: 3, name: 'Reviewer', email: 'reviewer@demo.com', role: 'reviewer' },
];

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

module.exports = {
  isDemoMode: () => !process.env.POSTGRES_URL && !process.env.DATABASE_URL && !!process.env.VERCEL,
  login: (email, password) => {
    const user = demoUsers.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
    if (user && password === 'Password@123') {
      return { token: signToken(user), user };
    }
    // Allow any demo user login if email matches or default to sales rep for convenience
    if (user) {
      return { token: signToken(user), user };
    }
    return null;
  },
  getUserById: (id) => demoUsers.find((u) => u.id === Number(id)) || demoUsers[1],
  getCustomers: () => customers,
  getProducts: () => products,
  getLeads: () => leads,
  getRfqs: () => rfqs,
  getRfqById: (id) => rfqs.find((r) => r.id === Number(id)),
  getQuotes: () => quotes,
  getQuoteById: (id) => quotes.find((q) => q.id === Number(id)),
  addCustomer: (data) => {
    const newCust = { id: customers.length + 1, ...data };
    customers.push(newCust);
    return newCust;
  },
  addProduct: (data) => {
    const { quantity_available = 0, reorder_level = 0, warehouse_location = 'WH-A', ...rest } = data;
    const newProd = {
      id: products.length + 1,
      ...rest,
      inventory: { quantity_available, reorder_level, warehouse_location },
    };
    products.push(newProd);
    return newProd;
  },
  addLead: (data) => {
    const cust = customers.find((c) => c.id === Number(data.customer_id)) || customers[0];
    const newLead = { id: leads.length + 1, customer: cust, created_at: new Date().toISOString(), ...data };
    leads.push(newLead);
    return newLead;
  },
  updateLead: (id, data) => {
    const lead = leads.find((l) => l.id === Number(id));
    if (lead) Object.assign(lead, data);
    return lead;
  },
  updateQuoteStatus: (id, status, notes) => {
    const quote = quotes.find((q) => q.id === Number(id));
    if (quote) {
      quote.status = status;
      quote.review_notes = notes;
    }
    return quote;
  },
};
