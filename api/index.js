let app;
let initError = null;

try {
  app = require('../backend/src/app');
} catch (e) {
  initError = {
    message: e.message,
    stack: e.stack,
  };
  console.error('Failed to load backend in api/index.js:', e);
}

let dbInitPromise = null;
async function ensureInit() {
  if (dbInitPromise) return dbInitPromise;
  dbInitPromise = (async () => {
    try {
      const { sequelize } = require('../backend/src/models');
      await sequelize.authenticate();
      const shouldForce = sequelize.getDialect() === 'sqlite';
      await sequelize.sync({ force: shouldForce });

      const seedForVercel = require('../backend/src/seedVercel');
      await seedForVercel();
    } catch (err) {
      console.error('Database initialization warning:', err.message);
    }
  })();
  return dbInitPromise;
}

module.exports = async (req, res) => {
  if (initError) {
    return res.status(500).json({
      error: 'Backend Initialization Error',
      details: initError,
    });
  }
  try {
    await ensureInit();
    return app(req, res);
  } catch (err) {
    console.error('Serverless execution error:', err);
    res.status(500).json({
      error: 'Serverless execution error',
      message: err.message,
      stack: err.stack,
    });
  }
};
