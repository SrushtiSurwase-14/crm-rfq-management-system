const sequelize = require('../config/database');

const User = require('./User');
const Customer = require('./Customer');
const Lead = require('./Lead');
const Product = require('./Product');
const Inventory = require('./Inventory');
const RFQ = require('./RFQ');
const RFQItem = require('./RFQItem');
const Quote = require('./Quote');
const QuoteItem = require('./QuoteItem');

// ---- Associations ----

// Customer <-> Lead (1:N)
Customer.hasMany(Lead, { foreignKey: 'customer_id', as: 'leads', onDelete: 'CASCADE' });
Lead.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

// User <-> Lead (assigned_to) (1:N)
User.hasMany(Lead, { foreignKey: 'assigned_to', as: 'assignedLeads' });
Lead.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });

// Product <-> Inventory (1:1)
Product.hasOne(Inventory, { foreignKey: 'product_id', as: 'inventory', onDelete: 'CASCADE' });
Inventory.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Lead <-> RFQ (1:N, optional)
Lead.hasMany(RFQ, { foreignKey: 'lead_id', as: 'rfqs' });
RFQ.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });

// Customer <-> RFQ (1:N)
Customer.hasMany(RFQ, { foreignKey: 'customer_id', as: 'rfqs' });
RFQ.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

// User <-> RFQ (created_by)
User.hasMany(RFQ, { foreignKey: 'created_by', as: 'createdRfqs' });
RFQ.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// RFQ <-> RFQItem (1:N)
RFQ.hasMany(RFQItem, { foreignKey: 'rfq_id', as: 'items', onDelete: 'CASCADE' });
RFQItem.belongsTo(RFQ, { foreignKey: 'rfq_id', as: 'rfq' });

// Product <-> RFQItem (1:N, optional match)
Product.hasMany(RFQItem, { foreignKey: 'matched_product_id', as: 'rfqItems' });
RFQItem.belongsTo(Product, { foreignKey: 'matched_product_id', as: 'matchedProduct' });

// RFQ <-> Quote (1:1)
RFQ.hasOne(Quote, { foreignKey: 'rfq_id', as: 'quote', onDelete: 'CASCADE' });
Quote.belongsTo(RFQ, { foreignKey: 'rfq_id', as: 'rfq' });

// Customer <-> Quote (1:N)
Customer.hasMany(Quote, { foreignKey: 'customer_id', as: 'quotes' });
Quote.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

// User <-> Quote (reviewed_by)
User.hasMany(Quote, { foreignKey: 'reviewed_by', as: 'reviewedQuotes' });
Quote.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer' });

// Quote <-> QuoteItem (1:N)
Quote.hasMany(QuoteItem, { foreignKey: 'quote_id', as: 'items', onDelete: 'CASCADE' });
QuoteItem.belongsTo(Quote, { foreignKey: 'quote_id', as: 'quote' });

// Product <-> QuoteItem (1:N)
Product.hasMany(QuoteItem, { foreignKey: 'product_id', as: 'quoteItems' });
QuoteItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

module.exports = {
  sequelize,
  User,
  Customer,
  Lead,
  Product,
  Inventory,
  RFQ,
  RFQItem,
  Quote,
  QuoteItem,
};
