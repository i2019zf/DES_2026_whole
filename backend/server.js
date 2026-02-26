const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');

const app = express();

app.set('trust proxy', 1);

// Middlewares
app.use(cors({
  origin: 'https://i2019zf.github.io'
}));
app.use(express.json());

const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per window
});
app.use('/api/', limiter);

// FAILOVER HEALTH ROUTE
app.get('/api/auth/health', (req, res) => {
  res.status(200).send("OK");
});

// Use our routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 DESday_26 Server running on port ${PORT}`));