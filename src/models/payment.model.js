const db = require('../utils/database');

/**
 * Find all payments
 * @returns {Array} - Array of payments
 */
exports.findAll = () => {
  return db.findAll('payments');
};

/**
 * Find payments by user
 * @param {string} userId - User ID
 * @returns {Array} - Array of payments
 */
exports.findByUser = (userId) => {
  return db.find('payments', { user: userId });
};

/**
 * Find payment by ID
 * @param {string} id - Payment ID
 * @returns {object|null} - Payment object or null
 */
exports.findById = (id) => {
  return db.findById('payments', id);
};

/**
 * Find payment by reference
 * @param {string} reference - Payment reference
 * @returns {object|null} - Payment object or null
 */
exports.findByReference = (reference) => {
  return db.findOne('payments', { paymentReference: reference });
};

/**
 * Create a new payment
 * @param {object} paymentData - Payment data
 * @returns {object} - Created payment object
 */
exports.create = (paymentData) => {
  // Validate required fields
  const requiredFields = ['user', 'course', 'amount', 'paymentMethod'];
  const missingFields = requiredFields.filter(field => !paymentData[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
  
  // Validate payment method
  const validPaymentMethods = ['MTN', 'Orange', 'Credit Card'];
  if (!validPaymentMethods.includes(paymentData.paymentMethod)) {
    throw new Error(`Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}`);
  }
  
  // Validate payment status
  const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'];
  const status = paymentData.status || 'pending';
  
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid payment status. Must be one of: ${validStatuses.join(', ')}`);
  }
  
  // Generate payment reference if not provided
  const paymentReference = paymentData.paymentReference || 
    `PAY-${paymentData.paymentMethod.replace(' ', '')}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  
  // Create payment
  const payment = {
    ...paymentData,
    paymentReference,
    status,
    transactionId: paymentData.transactionId || null,
    providerReference: paymentData.providerReference || null,
    metadata: paymentData.metadata || {},
  };
  
  return db.insertOne('payments', payment);
};

/**
 * Update a payment
 * @param {string} id - Payment ID
 * @param {object} updateData - Data to update
 * @returns {object|null} - Updated payment or null
 */
exports.updateById = (id, updateData) => {
  return db.updateOne('payments', { _id: id }, updateData);
};

/**
 * Update payment by reference
 * @param {string} reference - Payment reference
 * @param {object} updateData - Data to update
 * @returns {object|null} - Updated payment or null
 */
exports.updateByReference = (reference, updateData) => {
  return db.updateOne('payments', { paymentReference: reference }, updateData);
};

/**
 * Delete a payment
 * @param {string} id - Payment ID
 * @returns {boolean} - Success status
 */
exports.deleteById = (id) => {
  return db.deleteOne('payments', { _id: id });
};

/**
 * Get payment statistics
 * @returns {object} - Payment statistics
 */
exports.getStatistics = () => {
  const payments = exports.findAll();
  
  const stats = {
    total: payments.length,
    completed: payments.filter(p => p.status === 'completed').length,
    pending: payments.filter(p => p.status === 'pending').length,
    failed: payments.filter(p => p.status === 'failed').length,
    totalAmount: payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0),
    byMethod: {
      MTN: payments.filter(p => p.paymentMethod === 'MTN').length,
      Orange: payments.filter(p => p.paymentMethod === 'Orange').length,
      'Credit Card': payments.filter(p => p.paymentMethod === 'Credit Card').length,
    },
  };
  
  return stats;
}; 