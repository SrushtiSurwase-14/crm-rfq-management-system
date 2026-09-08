require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');

const connectionUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const isVercel = !!process.env.VERCEL;

function createMockSequelize() {
  const models = {};
  return {
    models,
    define(modelName) {
      class MockModel {
        static async findOne() { return null; }
        static async findAll() { return []; }
        static async findByPk() { return null; }
        static async create(data) { return { id: 1, ...data }; }
        static async bulkCreate(arr) { return arr; }
        static async count() { return 0; }
        static hasMany() {}
        static belongsTo() {}
        static hasOne() {}
        static belongsToMany() {}
      }
      MockModel.init = () => MockModel;
      MockModel.hasMany = () => {};
      MockModel.belongsTo = () => {};
      MockModel.hasOne = () => {};
      MockModel.belongsToMany = () => {};
      models[modelName] = MockModel;
      return MockModel;
    },
    authenticate: async () => {
      if (connectionUrl) return true;
      console.log('Running in mock in-memory mode without external database.');
      return true;
    },
    sync: async () => {},
    getDialect: () => (connectionUrl ? 'postgres' : 'mock'),
    transaction: async () => ({
      commit: async () => {},
      rollback: async () => {},
    }),
  };
}

let sequelize;

try {
  if (connectionUrl) {
    // Production PostgreSQL (e.g. Vercel Postgres, Neon, Supabase)
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
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '..', '..', process.env.DB_STORAGE || './data/database.sqlite'),
      logging: false,
    });
  } else {
    // Vercel serverless without POSTGRES_URL: try loading postgres dialect safely
    try {
      sequelize = new Sequelize('postgres://dummy:dummy@localhost:5432/dummy', {
        dialect: 'postgres',
        logging: false,
      });
    } catch {
      sequelize = createMockSequelize();
    }
  }
} catch (err) {
  console.warn('Sequelize initialization fallback to mock:', err.message);
  sequelize = createMockSequelize();
}

if (!sequelize) {
  sequelize = createMockSequelize();
}

module.exports = sequelize;
