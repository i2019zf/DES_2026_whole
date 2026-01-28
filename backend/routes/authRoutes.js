const express = require('express');
const router = express.Router();
const { verifyAndCheckMember, generateRollingTicket } = require('../controllers/authController');

// 1. Path for the initial Google Login & Whitelist Check
router.post('/verify', verifyAndCheckMember);

// 2. Path for the 30-second rolling QR generation
// THIS IS THE ONE PROBABLY MISSING
router.post('/generate-ticket', generateRollingTicket);

module.exports = router;