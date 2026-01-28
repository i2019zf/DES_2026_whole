// backend/controllers/authController.js
const { OAuth2Client } = require('google-auth-library');
const db = require('../config/db'); // Import our DB connection
require('dotenv').config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const jwt = require('jsonwebtoken');

exports.verifyAndCheckMember = async (req, res) => {
    const { idToken } = req.body; // Sent from React frontend

    try {
        // 1. Verify the token with Google
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const email = payload.email;

        // 2. Search for the user in our PostgreSQL "members" table
        const userResult = await db.query('SELECT * FROM members WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(403).json({ success: false, message: "Access Denied: Not a registered department member." });
        }

        const user = userResult.rows[0];

        // 3. Logic for Entry and Malpractice Tracking
        if (user.scan_count === 0) {
            // First time entry
            await db.query(
                'UPDATE members SET has_entered = true, first_entry_at = NOW(), scan_count = 1 WHERE email = $1',
                [email]
            );
            return res.json({ success: true, message: "Welcome to DESday_26!", user });
        } else {
            // DUPLICATE ENTRY DETECTED
            await db.query(
                'UPDATE members SET scan_count = scan_count + 1, last_scan_at = NOW() WHERE email = $1',
                [email]
            );
            return res.status(409).json({ 
                success: false, 
                message: "WARNING: Duplicate Scan Detected!", 
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
        // 1. Verify user is in the DES whitelist [cite: 6, 14]
        const userResult = await db.query('SELECT * FROM members WHERE email = $1', [email]);
        if (userResult.rows.length === 0) return res.status(403).json({ message: "Unauthorized" });

        // 2. Create a 'Time Window' (changes every 30 seconds)
        const timeWindow = Math.floor(Date.now() / 30000);

        // 3. Sign the ticket with your SECRET_KEY
        // This token expires in 60 seconds
        const ticketToken = jwt.sign(
            { email, window: timeWindow },
            process.env.JWT_SECRET,
            { expiresIn: '60s' }
        );

        res.json({ ticketToken });
    } catch (error) {
        res.status(500).json({ message: "Error generating ticket" });
    }
};
