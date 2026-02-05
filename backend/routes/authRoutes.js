const express = require('express');
const router = express.Router();
const { verifyAndCheckMember, generateRollingTicket, verifyQR } = require('../controllers/authController');

// Existing routes
router.post('/verify', verifyAndCheckMember);
router.post('/generate-ticket', generateRollingTicket);
router.post('/verify-qr', verifyQR);

// FIX: Attach the check-admin route correctly to the router
router.get('/check-admin', (req, res) => {
    const apiKey = req.headers['x-api-key'];
    console.log("Key received:", apiKey); // Debugging line
    console.log("Expected key:", process.env.SCANNER_ADMIN_KEY); // Debugging line
    
    if (apiKey && apiKey === process.env.SCANNER_ADMIN_KEY) {
        return res.sendStatus(200);
    }
    res.sendStatus(401);
});

module.exports = router;