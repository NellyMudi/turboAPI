const db = require('../utils/database');

/**
 * Find all registrations
 * @returns {Array} - Array of registrations
 */
exports.findAll = () => {
  return db.findAll('registrations');
};

/**
 * Find registrations by user
 * @param {string} userId - User ID
 * @returns {Array} - Array of registrations
 */
exports.findByUser = (userId) => {
  return db.find('registrations', { user: userId });
};

/**
 * Find registration by user and course
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @returns {object|null} - Registration object or null
 */
exports.findByUserAndCourse = (userId, courseId) => {
  return db.findOne('registrations', { user: userId, course: courseId });
};

/**
 * Find registration by ID
 * @param {string} id - Registration ID
 * @returns {object|null} - Registration object or null
 */
exports.findById = (id) => {
  return db.findById('registrations', id);
};

/**
 * Create a new registration
 * @param {object} registrationData - Registration data
 * @returns {object} - Created registration object
 */
exports.create = (registrationData) => {
  // Validate required fields
  const requiredFields = ['user', 'course', 'paymentAmount', 'accessExpiresAt'];
  const missingFields = requiredFields.filter(field => !registrationData[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
  
  // Validate payment status
  const validPaymentStatuses = ['pending', 'completed', 'failed', 'refunded'];
  const status = registrationData.paymentStatus || 'pending';
  
  if (!validPaymentStatuses.includes(status)) {
    throw new Error(`Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}`);
  }
  
  // Check for duplicate registration
  const existing = exports.findByUserAndCourse(registrationData.user, registrationData.course);
  if (existing) {
    throw new Error('User is already registered for this course');
  }
  
  // Create registration
  const registration = {
    ...registrationData,
    paymentStatus: status,
  };
  
  return db.insertOne('registrations', registration);
};

/**
 * Update a registration
 * @param {string} id - Registration ID
 * @param {object} updateData - Data to update
 * @returns {object|null} - Updated registration or null
 */
exports.updateById = (id, updateData) => {
  return db.updateOne('registrations', { _id: id }, updateData);
};

/**
 * Delete a registration
 * @param {string} id - Registration ID
 * @returns {boolean} - Success status
 */
exports.deleteById = (id) => {
  return db.deleteOne('registrations', { _id: id });
}; 