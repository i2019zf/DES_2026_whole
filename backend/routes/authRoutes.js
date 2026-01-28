// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { verifyAndCheckMember } = require('../controllers/authController');

// This defines the URL: http://your-ngrok-url/api/auth/verify
router.post('/verify', verifyAndCheckMember);

module.exports = router;
