const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Quote = sequelize.define('Quote', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  rfq_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  customer_id: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.ENUM('draft', 'pending_approval', 'approved', 'rejected', 'sent'),
    allowNull: false,
    defaultValue: 'draft',
  },
  total_amount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  reviewed_by: { type: DataTypes.INTEGER, allowNull: true },
  reviewed_at: { type: DataTypes.DATE, allowNull: true },
  review_notes: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'quotes',
  underscored: true,
  timestamps: true,
});

module.exports = Quote;
