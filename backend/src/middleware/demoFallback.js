/**
 * demoFallback.js
 * Intercepts routes in demo mode when external database is not connected.
 */
const demoStore = require('../services/demoStore');

module.exports = function demoFallback(req, res, next) {
  if (!demoStore.isDemoMode()) {
    return next();
  }

  const { method, path } = req;

  // API root or health
  if (path === '/api' || path === '/api/health') {
    return res.json({
      name: 'ApexRFQ API',
      status: 'online',
      mode: 'demo_in_memory',
      message: 'Running in demo mode. Connect Vercel Postgres in the Storage tab to activate persistent cloud storage.',
      timestamp: new Date().toISOString(),
    });
  }

  // Auth login
  if (path === '/api/auth/login' && method === 'POST') {
    const { email, password } = req.body || {};
    const result = demoStore.login(email, password);
    if (!result) {
      return res.status(401).json({ error: 'Invalid credentials. Use sales@demo.com / Password@123' });
    }
    return res.json(result);
  }

  // Auth me
  if (path === '/api/auth/me' && method === 'GET') {
    return res.json({ user: demoStore.getUserById(req.user?.id || 2) });
  }

  // Customers
  if (path === '/api/customers' && method === 'GET') {
    return res.json({ customers: demoStore.getCustomers() });
  }
  if (path === '/api/customers' && method === 'POST') {
    const customer = demoStore.addCustomer(req.body);
    return res.status(201).json({ customer });
  }

  // Products
  if (path === '/api/products' && method === 'GET') {
    return res.json({ products: demoStore.getProducts() });
  }
  if (path === '/api/products' && method === 'POST') {
    const product = demoStore.addProduct(req.body);
    return res.status(201).json({ product });
  }

  // Leads
  if (path === '/api/leads' && method === 'GET') {
    return res.json({ leads: demoStore.getLeads() });
  }
  if (path === '/api/leads' && method === 'POST') {
    const lead = demoStore.addLead(req.body);
    return res.status(201).json({ lead });
  }
  const leadMatch = path.match(/^\/api\/leads\/(\d+)$/);
  if (leadMatch && method === 'PUT') {
    const lead = demoStore.updateLead(leadMatch[1], req.body);
    return res.json({ lead });
  }

  // RFQs
  if (path === '/api/rfqs' && method === 'GET') {
    return res.json({ rfqs: demoStore.getRfqs() });
  }
  const rfqMatch = path.match(/^\/api\/rfqs\/(\d+)$/);
  if (rfqMatch && method === 'GET') {
    const rfq = demoStore.getRfqById(rfqMatch[1]);
    if (!rfq) return res.status(404).json({ error: 'RFQ not found' });
    return res.json({ rfq });
  }

  // Quotes
  if (path === '/api/quotes' && method === 'GET') {
    return res.json({ quotes: demoStore.getQuotes() });
  }
  const quoteMatch = path.match(/^\/api\/quotes\/(\d+)$/);
  if (quoteMatch && method === 'GET') {
    const quote = demoStore.getQuoteById(quoteMatch[1]);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    return res.json({ quote });
  }
  const quoteApproveMatch = path.match(/^\/api\/quotes\/(\d+)\/approve$/);
  if (quoteApproveMatch && method === 'POST') {
    const quote = demoStore.updateQuoteStatus(quoteApproveMatch[1], 'approved', req.body.review_notes);
    return res.json({ quote });
  }
  const quoteRejectMatch = path.match(/^\/api\/quotes\/(\d+)\/reject$/);
  if (quoteRejectMatch && method === 'POST') {
    const quote = demoStore.updateQuoteStatus(quoteRejectMatch[1], 'rejected', req.body.review_notes);
    return res.json({ quote });
  }

  // Fallback to normal routes if not intercepted
  next();
};
