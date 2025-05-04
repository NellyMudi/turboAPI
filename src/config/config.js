const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_key_for_dev',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
}; 