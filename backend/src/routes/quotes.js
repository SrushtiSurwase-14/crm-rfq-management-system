const express = require('express');
const router = express.Router();
const controller = require('../controllers/quoteController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.get);
router.put('/:id/items/:itemId', authorize('admin', 'reviewer', 'sales'), controller.updateItem);
router.post('/:id/approve', authorize('admin', 'reviewer'), controller.approve);
router.post('/:id/reject', authorize('admin', 'reviewer'), controller.reject);

module.exports = router;
