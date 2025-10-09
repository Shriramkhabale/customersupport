

const express = require('express');
const router = express.Router();
const controller = require('../controllers/ticketOptionsController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/add', authMiddleware, controller.addTicketOption);
router.get('/:companyId', authMiddleware, controller.getTicketOptions);
router.get('/', authMiddleware, controller.getTicketOptions);
// Add these new routes for delete operations
router.delete('/:companyId/:category/:index', authMiddleware, controller.deleteTicketOption);
router.put('/:companyId', authMiddleware, controller.updateTicketOptions);
module.exports = router;