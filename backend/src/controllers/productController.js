const { Product, Inventory } = require('../models');
const { validationResult } = require('express-validator');
const sequelize = require('../config/database');

const includeInventory = [{ model: Inventory, as: 'inventory' }];

exports.list = async (req, res) => {
  const products = await Product.findAll({ include: includeInventory, order: [['name', 'ASC']] });
  res.json({ products });
};

exports.get = async (req, res) => {
  const product = await Product.findByPk(req.params.id, { include: includeInventory });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ product });
};

// Creates a product AND its inventory row in one transaction, since every
// product must have exactly one inventory record for stock-checking to work.
exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const t = await sequelize.transaction();
  try {
    const { quantity_available = 0, reorder_level = 0, warehouse_location, ...productFields } = req.body;

    const product = await Product.create(productFields, { transaction: t });
    await Inventory.create(
      { product_id: product.id, quantity_available, reorder_level, warehouse_location },
      { transaction: t }
    );

    await t.commit();
    const fullProduct = await Product.findByPk(product.id, { include: includeInventory });
    res.status(201).json({ product: fullProduct });
  } catch (err) {
    await t.rollback();
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'A product with this CAS number already exists' });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const { quantity_available, reorder_level, warehouse_location, ...productFields } = req.body;
  await product.update(productFields);

  if (quantity_available !== undefined || reorder_level !== undefined || warehouse_location !== undefined) {
    const inventory = await Inventory.findOne({ where: { product_id: product.id } });
    if (inventory) {
      await inventory.update({
        ...(quantity_available !== undefined && { quantity_available }),
        ...(reorder_level !== undefined && { reorder_level }),
        ...(warehouse_location !== undefined && { warehouse_location }),
      });
    }
  }

  const fullProduct = await Product.findByPk(product.id, { include: includeInventory });
  res.json({ product: fullProduct });
};

exports.remove = async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  await product.destroy();
  res.status(204).send();
};

// ---- Dedicated inventory endpoints ----

exports.listInventory = async (req, res) => {
  const inventory = await Inventory.findAll({ include: [{ model: Product, as: 'product' }] });
  res.json({ inventory });
};

exports.adjustInventory = async (req, res) => {
  const { quantity_available, reorder_level, warehouse_location } = req.body;
  const inventory = await Inventory.findOne({ where: { product_id: req.params.productId } });
  if (!inventory) return res.status(404).json({ error: 'Inventory record not found for this product' });

  await inventory.update({
    ...(quantity_available !== undefined && { quantity_available }),
    ...(reorder_level !== undefined && { reorder_level }),
    ...(warehouse_location !== undefined && { warehouse_location }),
  });

  res.json({ inventory });
};
