const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Collection files paths
const COLLECTIONS = {
  users: path.join(dataDir, 'users.json'),
  courses: path.join(dataDir, 'courses.json'),
  materials: path.join(dataDir, 'materials.json'),
  registrations: path.join(dataDir, 'registrations.json'),
};

// Initialize collection files if they don't exist
Object.values(COLLECTIONS).forEach((filePath) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
  }
});

/**
 * Read data from a collection
 * @param {string} collection - Collection name
 * @returns {Array} - Collection data
 */
const readCollection = (collection) => {
  try {
    const filePath = COLLECTIONS[collection];
    if (!filePath) throw new Error(`Collection ${collection} does not exist`);
    
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading collection ${collection}:`, error);
    return [];
  }
};

/**
 * Write data to a collection
 * @param {string} collection - Collection name
 * @param {Array} data - Data to write
 * @returns {boolean} - Success status
 */
const writeCollection = (collection, data) => {
  try {
    const filePath = COLLECTIONS[collection];
    if (!filePath) throw new Error(`Collection ${collection} does not exist`);
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing to collection ${collection}:`, error);
    return false;
  }
};

/**
 * Find all documents in a collection
 * @param {string} collection - Collection name
 * @returns {Array} - Found documents
 */
exports.findAll = (collection) => {
  return readCollection(collection);
};

/**
 * Find documents in a collection by filter
 * @param {string} collection - Collection name
 * @param {object} filter - Filter object
 * @returns {Array} - Found documents
 */
exports.find = (collection, filter = {}) => {
  const data = readCollection(collection);
  
  if (Object.keys(filter).length === 0) {
    return data;
  }
  
  return data.filter(item => {
    return Object.entries(filter).every(([key, value]) => {
      if (key === '_id' && value) {
        return item._id === value;
      } else if (key.includes('.')) {
        // Handle nested properties like 'user.id'
        const parts = key.split('.');
        let nested = item;
        for (const part of parts) {
          if (!nested || !nested[part]) return false;
          nested = nested[part];
        }
        return nested === value;
      }
      return item[key] === value;
    });
  });
};

/**
 * Find one document in a collection by filter
 * @param {string} collection - Collection name
 * @param {object} filter - Filter object
 * @returns {object|null} - Found document or null
 */
exports.findOne = (collection, filter = {}) => {
  const results = exports.find(collection, filter);
  return results.length > 0 ? results[0] : null;
};

/**
 * Find document by ID
 * @param {string} collection - Collection name
 * @param {string} id - Document ID
 * @returns {object|null} - Found document or null
 */
exports.findById = (collection, id) => {
  return exports.findOne(collection, { _id: id });
};

/**
 * Insert a document into a collection
 * @param {string} collection - Collection name
 * @param {object} document - Document to insert
 * @returns {object} - Inserted document
 */
exports.insertOne = (collection, document) => {
  const data = readCollection(collection);
  
  // Add ID and timestamps
  const newDocument = {
    ...document,
    _id: document._id || uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  data.push(newDocument);
  writeCollection(collection, data);
  
  return newDocument;
};

/**
 * Update a document in a collection
 * @param {string} collection - Collection name
 * @param {object} filter - Filter to find document
 * @param {object} update - Update object
 * @returns {object|null} - Updated document or null
 */
exports.updateOne = (collection, filter, update) => {
  const data = readCollection(collection);
  let updated = null;
  
  const newData = data.map(item => {
    let matches = true;
    
    // Check if item matches filter
    for (const [key, value] of Object.entries(filter)) {
      if (item[key] !== value) {
        matches = false;
        break;
      }
    }
    
    if (matches) {
      updated = {
        ...item,
        ...update,
        updatedAt: new Date().toISOString(),
      };
      return updated;
    }
    
    return item;
  });
  
  writeCollection(collection, newData);
  return updated;
};

/**
 * Delete a document from a collection
 * @param {string} collection - Collection name
 * @param {object} filter - Filter to find document
 * @returns {boolean} - Success status
 */
exports.deleteOne = (collection, filter) => {
  const data = readCollection(collection);
  const initialLength = data.length;
  
  const newData = data.filter(item => {
    for (const [key, value] of Object.entries(filter)) {
      if (item[key] !== value) {
        return true;
      }
    }
    return false;
  });
  
  writeCollection(collection, newData);
  return newData.length < initialLength;
};

/**
 * Check if a document exists
 * @param {string} collection - Collection name
 * @param {object} filter - Filter to find document
 * @returns {boolean} - Whether document exists
 */
exports.exists = (collection, filter) => {
  return exports.findOne(collection, filter) !== null;
}; 