const Payment = require('../models/payment.model');
const Course = require('../models/course.model');
const Registration = require('../models/registration.model');
const User = require('../models/user.model');

/**
 * Mock payment providers for simulation
 */
const PaymentProviders = {
  MTN: {
    processPayment: async (paymentData) => {
      // Mock MTN Mobile Money processing
      const { phoneNumber, amount } = paymentData;
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock success/failure (90% success rate)
      const isSuccess = Math.random() < 0.9;
      
      if (isSuccess) {
        return {
          success: true,
          transactionId: `MTN-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          providerReference: `MTN-REF-${Math.floor(Math.random() * 1000000000)}`,
          status: 'completed',
          message: 'Payment processed successfully via MTN Mobile Money',
        };
      } else {
        return {
          success: false,
          status: 'failed',
          message: 'Payment failed. Please check your MTN Mobile Money balance and try again.',
        };
      }
    },
  },
  
  Orange: {
    processPayment: async (paymentData) => {
      // Mock Orange Money processing
      const { phoneNumber, amount } = paymentData;
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock success/failure (85% success rate)
      const isSuccess = Math.random() < 0.85;
      
      if (isSuccess) {
        return {
          success: true,
          transactionId: `ORG-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          providerReference: `ORG-REF-${Math.floor(Math.random() * 1000000000)}`,
          status: 'completed',
          message: 'Payment processed successfully via Orange Money',
        };
      } else {
        return {
          success: false,
          status: 'failed',
          message: 'Payment failed. Please check your Orange Money account and try again.',
        };
      }
    },
  },
  
  'Credit Card': {
    processPayment: async (paymentData) => {
      // Mock Credit Card processing
      const { cardNumber, expiryMonth, expiryYear, cvv, amount } = paymentData;
      
      // Basic card validation
      if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
        return {
          success: false,
          status: 'failed',
          message: 'Invalid card number',
        };
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock success/failure (95% success rate for credit cards)
      const isSuccess = Math.random() < 0.95;
      
      if (isSuccess) {
        return {
          success: true,
          transactionId: `CC-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          providerReference: `CC-REF-${Math.floor(Math.random() * 1000000000)}`,
          status: 'completed',
          message: 'Payment processed successfully via Credit Card',
        };
      } else {
        return {
          success: false,
          status: 'failed',
          message: 'Payment failed. Please check your card details and try again.',
        };
      }
    },
  },
};

/**
 * @desc    Process course payment
 * @route   POST /api/payments/process
 * @access  Private
 */
exports.processPayment = async (req, res) => {
  try {
    const { courseId, paymentMethod, paymentDetails } = req.body;

    // Validate required fields
    if (!courseId || !paymentMethod || !paymentDetails) {
      return res.status(400).json({
        success: false,
        message: 'Course ID, payment method, and payment details are required',
      });
    }

    // Get course details
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check if already registered
    const existingRegistration = await Registration.findByUserAndCourse(
      req.user._id,
      courseId
    );

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this course',
      });
    }

    // Create initial payment record
    const payment = await Payment.create({
      user: req.user._id,
      course: courseId,
      amount: course.price,
      paymentMethod,
      status: 'processing',
      metadata: {
        courseName: course.title,
        userEmail: req.user.email,
        paymentDetails: paymentDetails,
      },
    });

    // Process payment with respective provider
    const provider = PaymentProviders[paymentMethod];
    if (!provider) {
      await Payment.updateById(payment._id, { status: 'failed' });
      return res.status(400).json({
        success: false,
        message: 'Unsupported payment method',
      });
    }

    const paymentResult = await provider.processPayment({
      ...paymentDetails,
      amount: course.price,
    });

    // Update payment status
    const updatedPayment = await Payment.updateById(payment._id, {
      status: paymentResult.status,
      transactionId: paymentResult.transactionId,
      providerReference: paymentResult.providerReference,
    });

    if (paymentResult.success) {
      // Calculate access expiry date
      const accessPeriod = course.duration + course.accessPeriod;
      const accessExpiresAt = new Date();
      accessExpiresAt.setDate(accessExpiresAt.getDate() + accessPeriod * 7);

      // Create registration
      const registration = await Registration.create({
        user: req.user._id,
        course: courseId,
        paymentStatus: 'completed',
        paymentId: payment.paymentReference,
        paymentAmount: course.price,
        accessExpiresAt: accessExpiresAt.toISOString(),
      });

      // Update user's registered courses
      await User.updateById(req.user._id, {
        registeredCourses: [...(req.user.registeredCourses || []), courseId],
      });

      res.status(200).json({
        success: true,
        message: paymentResult.message,
        data: {
          payment: updatedPayment,
          registration: registration,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: paymentResult.message,
        data: {
          payment: updatedPayment,
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: error.message,
    });
  }
};

/**
 * @desc    Get payment status
 * @route   GET /api/payments/:id
 * @access  Private
 */
exports.getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Check if user owns this payment
    if (payment.user !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payment',
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving payment',
      error: error.message,
    });
  }
};

/**
 * @desc    Get user's payment history
 * @route   GET /api/payments/history
 * @access  Private
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.findByUser(req.user._id);

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving payment history',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all payments (Admin only)
 * @route   GET /api/payments
 * @access  Private (Admin)
 */
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll();

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving payments',
      error: error.message,
    });
  }
};

/**
 * @desc    Get payment statistics (Admin only)
 * @route   GET /api/payments/stats
 * @access  Private (Admin)
 */
exports.getPaymentStats = async (req, res) => {
  try {
    const stats = await Payment.getStatistics();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving payment statistics',
      error: error.message,
    });
  }
};

/**
 * @desc    Refund payment (Admin only)
 * @route   POST /api/payments/:id/refund
 * @access  Private (Admin)
 */
exports.refundPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed payments can be refunded',
      });
    }

    // Update payment status to refunded
    const updatedPayment = await Payment.updateById(payment._id, {
      status: 'refunded',
      refundedAt: new Date().toISOString(),
      refundedBy: req.user._id,
    });

    // Update registration status
    await Registration.updateOne(
      { paymentId: payment.paymentReference },
      { paymentStatus: 'refunded' }
    );

    res.status(200).json({
      success: true,
      message: 'Payment refunded successfully',
      data: updatedPayment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing refund',
      error: error.message,
    });
  }
}; 