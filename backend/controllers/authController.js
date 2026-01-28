const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.verifyAndCheckMember = async (req, res) => {
    const { idToken } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const email = payload.email;

        const userResult = await db.query('SELECT * FROM members WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(403).json({ 
                success: false, 
                message: "Access Denied: Not registered for CONVERGENCE 2026." 
            });
        }

        const user = userResult.rows[0];

        if (user.scan_count === 0) {
            await db.query(
                'UPDATE members SET has_entered = true, first_entry_at = NOW(), scan_count = 1 WHERE email = $1',
                [email]
            );
            return res.json({ success: true, message: "Welcome to DES Day!", user });
        } else {
            await db.query(
                'UPDATE members SET scan_count = scan_count + 1, last_scan_at = NOW() WHERE email = $1',
                [email]
            );
            return res.status(409).json({ 
                success: false, 
                message: "DUPLICATE SCAN DETECTED!", 
                attempts: user.scan_count + 1 
            });
        }
    } catch (error) {
        console.error(error);
        res.status(401).json({ success: false, message: "Authentication failed." });
    }
};

exports.generateRollingTicket = async (req, res) => {
    const { email } = req.body;
    try {
        const timeWindow = Math.floor(Date.now() / 30000);
        const ticketToken = jwt.sign(
            { email, window: timeWindow },
            process.env.JWT_SECRET,
            { expiresIn: '60s' }
        );
        res.json({ success: true, ticketToken });
    } catch (error) {
        res.status(500).json({ message: "Error generating dynamic ticket" });
    }
};
exports.verifyQR = async (req, res) => {
    const { token } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userResult = await db.query('SELECT * FROM members WHERE email = $1', [decoded.email]);
        
        if (userResult.rows.length > 0) {
            res.json({ success: true, message: "Valid Entry", user: userResult.rows[0] });
        } else {
            res.status(403).json({ success: false, message: "Invalid Member" });
        }
    } catch (err) {
        res.status(401).json({ success: false, message: "QR Expired or Fake" });
    }
};