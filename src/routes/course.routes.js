const express = require('express');
const courseController = require('../controllers/course.controller');
const { protect, authorize } = require('../middleware/verifyToken');

const router = express.Router();

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: List of all courses
 */
router.get('/', courseController.getCourses);

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get a single course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course details
 *       404:
 *         description: Course not found
 */
router.get('/:id', courseController.getCourse);

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - price
 *               - duration
 *               - accessPeriod
 *               - instructor
 *               - category
 *               - level
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               duration:
 *                 type: number
 *               accessPeriod:
 *                 type: number
 *               instructor:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [Programming, Design, Business, Marketing, Other]
 *               level:
 *                 type: string
 *                 enum: [Beginner, Intermediate, Advanced]
 *     responses:
 *       201:
 *         description: Course created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('admin'), courseController.createCourse);

/**
 * @swagger
 * /api/courses/{id}/register:
 *   post:
 *     summary: Register for a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Invalid input or already registered
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Course not found
 */
router.post('/:id/register', protect, courseController.registerCourse);

module.exports = router; 