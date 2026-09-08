require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;
const isVercel = !!process.env.VERCEL;

// Import seed function for Vercel in-memory DB
const seedForVercel = isVercel ? require('./seedVercel') : null;

async function start() {
  try {
    await sequelize.authenticate();
    console.log(`Database connection established (${sequelize.getDialect()}).`);

    await sequelize.sync({ force: isVercel }); // force: true on Vercel to reset in-memory DB
    console.log('Database synced.');

    // Seed the in-memory database on Vercel cold starts
    if (isVercel && seedForVercel) {
      await seedForVercel();
      console.log('In-memory database seeded with demo data.');
    }

    app.listen(PORT, () => {
      console.log(`CRM & RFQ Automation API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
