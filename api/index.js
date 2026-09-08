const app = require('../backend/src/app');
const { sequelize } = require('../backend/src/models');
const seedForVercel = require('../backend/src/seedVercel');

let initPromise = null;
async function ensureInit() {
  if (!initPromise) {
    initPromise = (async () => {
      await sequelize.authenticate();
      await sequelize.sync({ force: true });
      if (seedForVercel) {
        await seedForVercel();
      }
    })();
  }
  return initPromise;
}

module.exports = async (req, res) => {
  try {
    await ensureInit();
    return app(req, res);
  } catch (err) {
    console.error('Serverless execution error:', err);
    res.status(500).json({ error: 'Server initialization failed' });
  }
};
