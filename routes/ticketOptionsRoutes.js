

const express = require('express');
const router = express.Router();
const controller = require('../controllers/ticketOptionsController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/add', authMiddleware, controller.addTicketOption);
router.get('/:companyId', authMiddleware, controller.getTicketOptions);
router.get('/', authMiddleware, controller.getTicketOptions);

module.exports = router;