require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');

const connectionUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const isVercel = !!process.env.VERCEL;

let sequelize;

if (connectionUrl) {
  // Production PostgreSQL (Vercel Postgres, Neon, Supabase, etc.)
  sequelize = new Sequelize(connectionUrl, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
  });
} else if (process.env.DB_DIALECT === 'postgres') {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      dialectOptions: {
        ssl: process.env.DB_SSL === 'false' ? false : { require: true, rejectUnauthorized: false },
      },
      logging: false,
    }
  );
} else if (!isVercel) {
  // Local development: file-based SQLite
  try {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '..', '..', process.env.DB_STORAGE || './data/database.sqlite'),
      logging: false,
    });
  } catch (err) {
    console.warn('SQLite initialization warning:', err.message);
  }
} else {
  // Vercel serverless without POSTGRES_URL:
  // Use pure JavaScript postgres dialect with dummy connection so model schemas
  // initialize safely without requiring the native sqlite3 C++ binding.
  sequelize = new Sequelize('postgres://dummy:dummy@localhost:5432/dummy', {
    dialect: 'postgres',
    logging: false,
  });
}

module.exports = sequelize;

