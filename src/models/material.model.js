const db = require('../utils/database');

/**
 * Find all materials for a course
 * @param {string} courseId - Course ID
 * @param {boolean} publishedOnly - Get only published materials
 * @returns {Array} - Array of materials
 */
exports.findByCourse = (courseId, publishedOnly = true) => {
  const materials = db.find('materials', { course: courseId });
  
  if (publishedOnly) {
    return materials.filter(material => material.isPublished);
  }
  
  return materials;
};

/**
 * Find a material by ID
 * @param {string} id - Material ID
 * @returns {object|null} - Material object or null
 */
exports.findById = (id) => {
  return db.findById('materials', id);
};

/**
 * Create a new material
 * @param {object} materialData - Material data
 * @returns {object} - Created material object
 */
exports.create = (materialData) => {
  // Validate required fields
  const requiredFields = ['title', 'description', 'type', 'content', 'course'];
  const missingFields = requiredFields.filter(field => !materialData[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
  
  // Validate material type
  const validTypes = ['PDF', 'Video', 'HTML', 'Link', 'Other'];
  if (!validTypes.includes(materialData.type)) {
    throw new Error(`Invalid material type. Must be one of: ${validTypes.join(', ')}`);
  }
  
  // Set defaults
  const material = {
    ...materialData,
    order: materialData.order || 0,
    isPublished: materialData.isPublished !== undefined ? materialData.isPublished : true,
  };
  
  return db.insertOne('materials', material);
};

/**
 * Update a material
 * @param {string} id - Material ID
 * @param {object} updateData - Data to update
 * @returns {object|null} - Updated material or null
 */
exports.updateById = (id, updateData) => {
  return db.updateOne('materials', { _id: id }, updateData);
};

/**
 * Delete a material
 * @param {string} id - Material ID
 * @returns {boolean} - Success status
 */
exports.deleteById = (id) => {
  return db.deleteOne('materials', { _id: id });
}; 