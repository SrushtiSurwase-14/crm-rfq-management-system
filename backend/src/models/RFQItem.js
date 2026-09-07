const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RFQItem = sequelize.define('RFQItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  rfq_id: { type: DataTypes.INTEGER, allowNull: false },
  raw_text: { type: DataTypes.STRING, allowNull: false }, // the fragment extracted from the email
  matched_product_id: { type: DataTypes.INTEGER, allowNull: true },
  match_confidence: { type: DataTypes.FLOAT, allowNull: true }, // 0-1
  requested_quantity: { type: DataTypes.FLOAT, allowNull: true },
  unit: { type: DataTypes.STRING, allowNull: true },
  is_trading_item: { type: DataTypes.BOOLEAN, defaultValue: false }, // not held in-house
}, {
  tableName: 'rfq_items',
  underscored: true,
  timestamps: true,
});

module.exports = RFQItem;
