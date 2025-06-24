const express = require('express');
const materialController = require('../controllers/material.controller');
const { protect, authorize } = require('../middleware/verifyToken');

const router = express.Router();

/**
 * @swagger
 * /api/materials/{courseId}:
 *   get:
 *     summary: Get all materials for a course
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of course materials
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not registered for course or access expired
 *       404:
 *         description: Course not found
 */
router.get('/:courseId', protect, materialController.getMaterials);

/**
 * @swagger
 * /api/materials/view/{id}:
 *   get:
 *     summary: View a specific material in a protected format
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Material content in view-only format
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not registered for course or access expired
 *       404:
 *         description: Material not found
 */
router.get('/view/:id', protect, materialController.viewMaterial);

/**
 * @swagger
 * /api/materials/admin/{courseId}:
 *   get:
 *     summary: Get all materials for a course (Admin only - bypasses registration check)
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of course materials (admin view)
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Course not found
 */
router.get('/admin/:courseId', protect, authorize('admin'), materialController.getAdminMaterials);

/**
 * @swagger
 * /api/materials/{courseId}:
 *   post:
 *     summary: Create a new material for a course
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - type
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [PDF, Video, HTML, Link, Other]
 *               content:
 *                 type: string
 *               order:
 *                 type: number
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Material created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Course not found
 */
router.post('/:courseId', protect, authorize('admin'), materialController.createMaterial);

/**
 * @swagger
 * /api/materials/{id}:
 *   put:
 *     summary: Update a material
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [PDF, Video, HTML, Link, Other]
 *               content:
 *                 type: string
 *               order:
 *                 type: number
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Material updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Material not found
 *   delete:
 *     summary: Delete a material
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Material deleted successfully
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Material not found
 */
router.put('/:id', protect, authorize('admin'), materialController.updateMaterial);
router.delete('/:id', protect, authorize('admin'), materialController.deleteMaterial);

module.exports = router; 