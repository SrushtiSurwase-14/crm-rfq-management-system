const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  cas_number: { type: DataTypes.STRING, allowNull: true, unique: true },
  category: { type: DataTypes.STRING, allowNull: true },
  unit: { type: DataTypes.STRING, allowNull: false, defaultValue: 'kg' },
  unit_price: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  // comma-separated alternate names/spellings used to help RFQ text matching
  aliases: { type: DataTypes.TEXT, allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'products',
  underscored: true,
  timestamps: true,
});

module.exports = Product;
