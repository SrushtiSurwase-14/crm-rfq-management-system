const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const controller = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', controller.list);
router.get('/inventory/all', controller.listInventory);
router.get('/:id', controller.get);
router.post(
  '/',
  authorize('admin', 'sales'),
  [
    body('name').notEmpty().withMessage('name is required'),
    body('unit_price').isFloat({ min: 0 }).withMessage('unit_price must be a non-negative number'),
  ],
  controller.create
);
router.put('/:id', authorize('admin', 'sales'), controller.update);
router.delete('/:id', authorize('admin'), controller.remove);
router.put('/:productId/inventory', authorize('admin', 'sales'), controller.adjustInventory);

module.exports = router;
