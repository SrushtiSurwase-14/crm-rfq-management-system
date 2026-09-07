const { Customer, Lead, RFQ } = require('../models');
const { validationResult } = require('express-validator');

exports.list = async (req, res) => {
  const customers = await Customer.findAll({ order: [['created_at', 'DESC']] });
  res.json({ customers });
};

exports.get = async (req, res) => {
  const customer = await Customer.findByPk(req.params.id, {
    include: [{ model: Lead, as: 'leads' }, { model: RFQ, as: 'rfqs' }],
  });
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json({ customer });
};

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ customer });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'A customer with this email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const customer = await Customer.findByPk(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  await customer.update(req.body);
  res.json({ customer });
};

exports.remove = async (req, res) => {
  const customer = await Customer.findByPk(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  await customer.destroy();
  res.status(204).send();
};
