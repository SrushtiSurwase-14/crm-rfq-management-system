const express = require('express');
const router = express.Router();
const controller = require('../controllers/rfqController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.get);
router.patch('/:id', controller.update);
router.post('/simulate-intake', controller.simulateIntake);
router.post('/:id/items', controller.addItem);
router.put('/:id/items/:itemId', controller.updateItem);
router.delete('/:id/items/:itemId', controller.deleteItem);
router.get('/:id/inventory-preview', controller.inventoryPreview);
router.post('/:id/generate-quote', controller.generateQuote);
router.delete('/:id', controller.remove);

module.exports = router;
