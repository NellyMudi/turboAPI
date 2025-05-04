const db = require('../utils/database');

/**
 * Find all courses
 * @returns {Array} - Array of courses
 */
exports.findAll = () => {
  return db.findAll('courses');
};

/**
 * Find a course by ID
 * @param {string} id - Course ID
 * @returns {object|null} - Course object or null
 */
exports.findById = (id) => {
  return db.findById('courses', id);
};

/**
 * Create a new course
 * @param {object} courseData - Course data
 * @returns {object} - Created course object
 */
exports.create = (courseData) => {
  // Validate required fields
  const requiredFields = ['title', 'description', 'price', 'duration', 'accessPeriod', 'instructor', 'category', 'level'];
  const missingFields = requiredFields.filter(field => !courseData[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
  
  // Validate enums
  const validCategories = ['Programming', 'Design', 'Business', 'Marketing', 'Other'];
  const validLevels = ['Beginner', 'Intermediate', 'Advanced'];
  
  if (!validCategories.includes(courseData.category)) {
    throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
  }
  
  if (!validLevels.includes(courseData.level)) {
    throw new Error(`Invalid level. Must be one of: ${validLevels.join(', ')}`);
  }
  
  // Create course
  return db.insertOne('courses', courseData);
};

/**
 * Update a course
 * @param {string} id - Course ID
 * @param {object} updateData - Data to update
 * @returns {object|null} - Updated course or null
 */
exports.updateById = (id, updateData) => {
  return db.updateOne('courses', { _id: id }, updateData);
};

/**
 * Delete a course
 * @param {string} id - Course ID
 * @returns {boolean} - Success status
 */
exports.deleteById = (id) => {
  return db.deleteOne('courses', { _id: id });
};

/**
 * Get course materials
 * @param {string} courseId - Course ID
 * @returns {Array} - Array of materials
 */
exports.getMaterials = (courseId) => {
  return db.find('materials', { course: courseId });
};

/**
 * Get course registrations
 * @param {string} courseId - Course ID
 * @returns {Array} - Array of registrations
 */
exports.getRegistrations = (courseId) => {
  return db.find('registrations', { course: courseId });
}; 