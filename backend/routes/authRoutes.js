const express = require('express');
const router = express.Router();
// Add verifyQR to the list below:
const { verifyAndCheckMember, generateRollingTicket, verifyQR } = require('../controllers/authController');

// Existing routes
router.post('/verify', verifyAndCheckMember);
router.post('/generate-ticket', generateRollingTicket);

// The new scanner route
router.post('/verify-qr', verifyQR);

module.exports = router;