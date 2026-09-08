require('dotenv').config();

let app;
let initError = null;

try {
  app = require('./app');
} catch (e) {
  initError = {
    message: e.message,
    stack: e.stack,
  };
  console.error('Failed to require ./app:', e);
}

const PORT = process.env.PORT || 5000;
const isVercel = !!process.env.VERCEL;

let dbInitPromise = null;
async function ensureDbInit() {
  if (dbInitPromise) return dbInitPromise;
  dbInitPromise = (async () => {
    try {
      const { sequelize } = require('./models');
      await sequelize.authenticate();
      console.log(`Database connected (${sequelize.getDialect()})`);

      const shouldForce = isVercel && sequelize.getDialect() === 'sqlite';
      await sequelize.sync({ force: shouldForce });
      console.log('Database synced');

      if (isVercel) {
        const seedForVercel = require('./seedVercel');
        await seedForVercel();
        console.log('Database seeded with demo data');
      }
    } catch (err) {
      console.error('Database initialization warning:', err.message);
    }
  })();
  return dbInitPromise;
}

if (!isVercel && app) {
  ensureDbInit().then(() => {
    app.listen(PORT, () => {
      console.log(`CRM & RFQ Automation API listening on http://localhost:${PORT}`);
    });
  }).catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = async (req, res) => {
  if (initError) {
    return res.status(500).json({
      error: 'Backend Initialization Error',
      details: initError,
    });
  }
  try {
    await ensureDbInit();
    return app(req, res);
  } catch (err) {
    return res.status(500).json({
      error: 'Serverless execution error',
      message: err.message,
      stack: err.stack,
    });
  }
};
