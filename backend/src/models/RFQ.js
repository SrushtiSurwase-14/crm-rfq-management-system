const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RFQ = sequelize.define('RFQ', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  lead_id: { type: DataTypes.INTEGER, allowNull: true },
  customer_id: { type: DataTypes.INTEGER, allowNull: true },
  source_channel: {
    type: DataTypes.ENUM('email', 'manual', 'whatsapp', 'web_form'),
    allowNull: false,
    defaultValue: 'email',
  },
  sender_email: { type: DataTypes.STRING, allowNull: true, validate: { isEmail: true } },
  subject: { type: DataTypes.STRING, allowNull: true },
  raw_body: { type: DataTypes.TEXT, allowNull: false },
  status: {
    type: DataTypes.ENUM(
      'received',        // just landed, not processed yet
      'extracted',        // line items extracted, awaiting quote
      'quote_drafted',     // quote generated, awaiting review
      'pending_approval',  // sent to reviewer
      'approved',          // reviewer approved -> "sent" to client
      'rejected',          // reviewer rejected
      'not_rfq'            // classifier decided this isn't an RFQ
    ),
    allowNull: false,
    defaultValue: 'received',
  },
  is_rfq: { type: DataTypes.BOOLEAN, allowNull: true }, // null = not yet classified
  confidence_score: { type: DataTypes.FLOAT, allowNull: true },
  created_by: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: 'rfqs',
  underscored: true,
  timestamps: true,
});

module.exports = RFQ;
