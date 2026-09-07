const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const controller = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.get);
router.post(
  '/',
  [body('name').notEmpty().withMessage('name is required'), body('email').isEmail().withMessage('valid email is required')],
  controller.create
);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
