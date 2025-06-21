const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { protect, authorize } = require('../middleware/verifyToken');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       required:
 *         - user
 *         - course
 *         - amount
 *         - paymentMethod
 *       properties:
 *         _id:
 *           type: string
 *           description: Payment ID
 *         user:
 *           type: string
 *           description: User ID
 *         course:
 *           type: string
 *           description: Course ID
 *         amount:
 *           type: number
 *           description: Payment amount
 *         paymentMethod:
 *           type: string
 *           enum: [MTN, Orange, Credit Card]
 *           description: Payment method
 *         status:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled, refunded]
 *           description: Payment status
 *         paymentReference:
 *           type: string
 *           description: Unique payment reference
 *         transactionId:
 *           type: string
 *           description: Transaction ID from payment provider
 *         providerReference:
 *           type: string
 *           description: Reference from payment provider
 *         metadata:
 *           type: object
 *           description: Additional payment metadata
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     MTNPaymentDetails:
 *       type: object
 *       required:
 *         - phoneNumber
 *       properties:
 *         phoneNumber:
 *           type: string
 *           description: MTN phone number (e.g., +237123456789)
 *           example: "+237123456789"
 *     
 *     OrangePaymentDetails:
 *       type: object
 *       required:
 *         - phoneNumber
 *       properties:
 *         phoneNumber:
 *           type: string
 *           description: Orange phone number (e.g., +237123456789)
 *           example: "+237123456789"
 *     
 *     CreditCardPaymentDetails:
 *       type: object
 *       required:
 *         - cardNumber
 *         - expiryMonth
 *         - expiryYear
 *         - cvv
 *         - cardholderName
 *       properties:
 *         cardNumber:
 *           type: string
 *           description: Credit card number
 *           example: "4111111111111111"
 *         expiryMonth:
 *           type: string
 *           description: Card expiry month (MM)
 *           example: "12"
 *         expiryYear:
 *           type: string
 *           description: Card expiry year (YYYY)
 *           example: "2025"
 *         cvv:
 *           type: string
 *           description: Card CVV
 *           example: "123"
 *         cardholderName:
 *           type: string
 *           description: Name on card
 *           example: "John Doe"
 *     
 *     PaymentRequest:
 *       type: object
 *       required:
 *         - courseId
 *         - paymentMethod
 *         - paymentDetails
 *       properties:
 *         courseId:
 *           type: string
 *           description: Course ID to pay for
 *         paymentMethod:
 *           type: string
 *           enum: [MTN, Orange, Credit Card]
 *           description: Payment method
 *         paymentDetails:
 *           oneOf:
 *             - $ref: '#/components/schemas/MTNPaymentDetails'
 *             - $ref: '#/components/schemas/OrangePaymentDetails'
 *             - $ref: '#/components/schemas/CreditCardPaymentDetails'
 *           description: Payment method specific details
 */

/**
 * @swagger
 * /api/payments/process:
 *   post:
 *     summary: Process course payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentRequest'
 *           examples:
 *             MTN:
 *               summary: MTN Mobile Money Payment
 *               value:
 *                 courseId: "course-id-here"
 *                 paymentMethod: "MTN"
 *                 paymentDetails:
 *                   phoneNumber: "+237123456789"
 *             Orange:
 *               summary: Orange Money Payment
 *               value:
 *                 courseId: "course-id-here"
 *                 paymentMethod: "Orange"
 *                 paymentDetails:
 *                   phoneNumber: "+237123456789"
 *             Credit Card:
 *               summary: Credit Card Payment
 *               value:
 *                 courseId: "course-id-here"
 *                 paymentMethod: "Credit Card"
 *                 paymentDetails:
 *                   cardNumber: "4111111111111111"
 *                   expiryMonth: "12"
 *                   expiryYear: "2025"
 *                   cvv: "123"
 *                   cardholderName: "John Doe"
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     payment:
 *                       $ref: '#/components/schemas/Payment'
 *                     registration:
 *                       type: object
 *       400:
 *         description: Payment failed or invalid input
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Course not found
 */
router.post('/process', protect, paymentController.processPayment);

/**
 * @swagger
 * /api/payments/history:
 *   get:
 *     summary: Get user's payment history
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 *       401:
 *         description: Not authorized
 */
router.get('/history', protect, paymentController.getPaymentHistory);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get payment status by ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - not your payment
 *       404:
 *         description: Payment not found
 */
router.get('/:id', protect, paymentController.getPayment);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get all payments (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All payments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 */
router.get('/', protect, authorize('admin'), paymentController.getAllPayments);

/**
 * @swagger
 * /api/payments/stats:
 *   get:
 *     summary: Get payment statistics (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     completed:
 *                       type: number
 *                     pending:
 *                       type: number
 *                     failed:
 *                       type: number
 *                     totalAmount:
 *                       type: number
 *                     byMethod:
 *                       type: object
 *                       properties:
 *                         MTN:
 *                           type: number
 *                         Orange:
 *                           type: number
 *                         'Credit Card':
 *                           type: number
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 */
router.get('/stats', protect, authorize('admin'), paymentController.getPaymentStats);

/**
 * @swagger
 * /api/payments/{id}/refund:
 *   post:
 *     summary: Refund a payment (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment refunded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Invalid payment status for refund
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Payment not found
 */
router.post('/:id/refund', protect, authorize('admin'), paymentController.refundPayment);

module.exports = router; 