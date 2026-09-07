require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log(`Database connection established (${sequelize.getDialect()}).`);

    // For this assignment we use sync() for simplicity (no separate migration
    // tooling needed to run the demo). In a production setup this would be
    // replaced with Sequelize migrations.
    await sequelize.sync();
    console.log('Database synced.');

    app.listen(PORT, () => {
      console.log(`CRM & RFQ Automation API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
