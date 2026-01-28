// backend/config/db.js
const { Pool } = require('pg');
require('dotenv').config(); // This command reads your .env file

// We create a "Pool" of connections
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// This helps us see if the connection actually worked
pool.on('connect', () => {
  console.log('✅ Connected to the PostgreSQL database');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
