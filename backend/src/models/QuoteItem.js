const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QuoteItem = sequelize.define('QuoteItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  quote_id: { type: DataTypes.INTEGER, allowNull: false },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.FLOAT, allowNull: false },
  unit_price: { type: DataTypes.FLOAT, allowNull: false },
  available_stock_at_quote: { type: DataTypes.FLOAT, allowNull: true },
  in_stock: { type: DataTypes.BOOLEAN, defaultValue: true },
  line_total: { type: DataTypes.FLOAT, allowNull: false },
}, {
  tableName: 'quote_items',
  underscored: true,
  timestamps: true,
});

module.exports = QuoteItem;
