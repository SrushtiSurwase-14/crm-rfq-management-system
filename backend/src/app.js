require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const leadRoutes = require('./routes/leads');
const productRoutes = require('./routes/products');
const rfqRoutes = require('./routes/rfqs');
const quoteRoutes = require('./routes/quotes');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  // Allow ALL vercel.app subdomains for this project
  /^https:\/\/crm-rfq-management-system.*\.vercel\.app$/,
  // Allow explicit production URL from env
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some((o) =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    if (allowed) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));


app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ApexRFQ Backend API',
    time: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      customers: '/api/customers',
      leads: '/api/leads',
      products: '/api/products',
      rfqs: '/api/rfqs',
      quotes: '/api/quotes',
    },
  });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/products', productRoutes);
app.use('/api/rfqs', rfqRoutes);
app.use('/api/quotes', quoteRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Generic error handler (catches anything thrown synchronously in a route)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
