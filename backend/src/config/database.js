require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');

const dialect = process.env.DB_DIALECT || 'sqlite';

// On Vercel (serverless), the filesystem is read-only so we use in-memory SQLite.
// Locally we use a file-based database for persistence between restarts.
const isVercel = !!process.env.VERCEL;

let sequelize;

if (dialect === 'postgres') {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false,
    }
  );
} else if (isVercel) {
  // Vercel serverless: use in-memory SQLite — seeded on every cold start.
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  });
} else {
  // Local dev: file-based SQLite with persistence.
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', '..', process.env.DB_STORAGE || './data/database.sqlite'),
    logging: false,
  });
}

module.exports = sequelize;
