const { Lead, Customer, User } = require('../models');
const { validationResult } = require('express-validator');

const includeOpts = [
  { model: Customer, as: 'customer' },
  { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
];

exports.list = async (req, res) => {
  const where = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.source) where.source = req.query.source;

  const leads = await Lead.findAll({ where, include: includeOpts, order: [['created_at', 'DESC']] });
  res.json({ leads });
};

exports.get = async (req, res) => {
  const lead = await Lead.findByPk(req.params.id, { include: includeOpts });
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json({ lead });
};

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const customer = await Customer.findByPk(req.body.customer_id);
    if (!customer) return res.status(400).json({ error: 'customer_id does not reference an existing customer' });

    const lead = await Lead.create(req.body);
    const fullLead = await Lead.findByPk(lead.id, { include: includeOpts });
    res.status(201).json({ lead: fullLead });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const lead = await Lead.findByPk(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  await lead.update(req.body);
  const fullLead = await Lead.findByPk(lead.id, { include: includeOpts });
  res.json({ lead: fullLead });
};

exports.remove = async (req, res) => {
  const lead = await Lead.findByPk(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  await lead.destroy();
  res.status(204).send();
};
