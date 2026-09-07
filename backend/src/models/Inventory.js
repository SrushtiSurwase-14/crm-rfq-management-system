const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Inventory = sequelize.define('Inventory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  product_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  quantity_available: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  reorder_level: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  warehouse_location: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'inventory',
  underscored: true,
  timestamps: true,
});

module.exports = Inventory;
