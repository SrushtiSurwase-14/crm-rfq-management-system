const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const controller = require('../controllers/leadController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.get);
router.post(
  '/',
  [
    body('customer_id').isInt().withMessage('customer_id is required'),
    body('source').notEmpty().withMessage('source is required'),
  ],
  controller.create
);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
