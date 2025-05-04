const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../utils/database');

/**
 * Find a user by ID
 * @param {string} id - User ID
 * @returns {object|null} - User object or null
 */
exports.findById = (id) => {
  return db.findById('users', id);
};

/**
 * Find a user by email
 * @param {string} email - User email
 * @returns {object|null} - User object or null
 */
exports.findByEmail = (email) => {
  return db.findOne('users', { email });
};

/**
 * Create a new user
 * @param {object} userData - User data
 * @returns {object} - Created user object
 */
exports.create = async (userData) => {
  // Create user with hashed password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);

  const user = db.insertOne('users', {
    name: userData.name,
    email: userData.email,
    password: hashedPassword,
    role: userData.role || 'user',
    registeredCourses: [],
  });

  // Don't return password
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Update a user
 * @param {string} id - User ID
 * @param {object} updateData - Data to update
 * @returns {object|null} - Updated user or null
 */
exports.updateById = (id, updateData) => {
  const updated = db.updateOne('users', { _id: id }, updateData);
  
  if (!updated) return null;
  
  // Don't return password
  const { password, ...userWithoutPassword } = updated;
  return userWithoutPassword;
};

/**
 * Generate JWT token for user
 * @param {object} user - User object
 * @returns {string} - JWT token
 */
exports.generateToken = (user) => {
  return jwt.sign({ id: user._id }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE,
  });
};

/**
 * Match password
 * @param {string} enteredPassword - Password to check
 * @param {string} hashedPassword - Stored hashed password
 * @returns {boolean} - Whether passwords match
 */
exports.matchPassword = async (enteredPassword, hashedPassword) => {
  return await bcrypt.compare(enteredPassword, hashedPassword);
}; 