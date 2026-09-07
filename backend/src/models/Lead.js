const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Lead = sequelize.define('Lead', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customer_id: { type: DataTypes.INTEGER, allowNull: false },
  source: {
    type: DataTypes.ENUM('event', 'meeting', 'campaign', 'inbound_email', 'inbound_whatsapp', 'website_form', 'outbound_cold'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('new', 'contacted', 'qualified', 'converted', 'lost'),
    allowNull: false,
    defaultValue: 'new',
  },
  assigned_to: { type: DataTypes.INTEGER, allowNull: true },
  category: {
    type: DataTypes.ENUM('Products', 'Vendors', 'Transporters', 'Brochures', 'COA Requests', 'Other'),
    allowNull: true,
  },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'leads',
  underscored: true,
  timestamps: true,
});

module.exports = Lead;
