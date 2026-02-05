const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 1. LOGIN: Verification ONLY (No recording)
exports.verifyAndCheckMember = async (req, res) => {
    const { idToken } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        
        // Check if user exists in whitelist
        const userResult = await db.query('SELECT * FROM members WHERE email = $1', [payload.email]);

        if (userResult.rows.length === 0) {
            return res.status(403).json({ success: false, message: "Email not in guest list." });
        }

        // Return user data but DO NOT update 'has_entered'
        res.json({ success: true, user: userResult.rows[0] });
    } catch (error) {
        res.status(401).json({ success: false, message: "Authentication failed." });
    }
};

// 2. SCANNER: The actual gatekeeper (Recording happens here)
// backend/controllers/authController.js

exports.verifyQR = async (req, res) => {
    const { token } = req.body;
    const apiKey = req.headers['x-api-key']; // 1. Grab the key from headers

    // 2. Validate the Admin Key first
    if (!apiKey || apiKey !== process.env.SCANNER_ADMIN_KEY) {
        return res.status(401).json({ 
            success: false, 
            message: "UNAUTHORIZED: Invalid Admin Key" 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userResult = await db.query('SELECT * FROM members WHERE email = $1', [decoded.email]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "USER NOT FOUND" });
        }

        const user = userResult.rows[0];

        if (user.has_entered) {
            // DUPLICATE ATTEMPT
            return res.status(409).json({ success: false, message: "ALREADY SCANNED!", user });
        } else {
            // FIRST VALID ENTRY
            await db.query('UPDATE members SET has_entered = true, first_entry_at = NOW() WHERE email = $1', [decoded.email]);
            return res.json({ success: true, message: "VALID ENTRY", user });
        }
    } catch (err) {
        res.status(401).json({ success: false, message: "QR EXPIRED OR INVALID" });
    }
};

// 3. TICKET GENERATOR
exports.generateRollingTicket = async (req, res) => {
    const { email } = req.body;
    try {
        const ticketToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '60s' });
        res.json({ success: true, ticketToken });
    } catch (error) {
        res.status(500).json({ success: false });
    }
};