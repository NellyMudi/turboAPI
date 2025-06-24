const Course = require('../models/course.model');
const Registration = require('../models/registration.model');
const User = require('../models/user.model');

/**
 * @desc    Get all courses
 * @route   GET /api/courses
 * @access  Public
 */
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.findAll();

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving courses',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single course
 * @route   GET /api/courses/:id
 * @access  Public
 */
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving course',
      error: error.message,
    });
  }
};

/**
 * @desc    Create new course
 * @route   POST /api/courses
 * @access  Private (Admin only)
 */
exports.createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);

    res.status(201).json({
      success: true,
      data: course,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating course',
      error: error.message,
    });
  }
};

/**
 * @desc    Update course
 * @route   PUT /api/courses/:id
 * @access  Private (Admin only)
 */
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const updatedCourse = await Course.updateById(req.params.id, req.body);

    res.status(200).json({
      success: true,
      data: updatedCourse,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating course',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete course
 * @route   DELETE /api/courses/:id
 * @access  Private (Admin only)
 */
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    await Course.deleteById(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting course',
      error: error.message,
    });
  }
};

/**
 * @desc    Register for a course (Quick registration with mock payment)
 * @route   POST /api/courses/:id/register
 * @access  Private
 * @deprecated Use /api/payments/process for better payment handling
 */
exports.registerCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check if already registered
    const existingRegistration = await Registration.findByUserAndCourse(
      req.user._id,
      course._id
    );

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this course',
      });
    }

    // Mock payment process (legacy)
    const paymentSuccess = Math.random() < 0.9; // 90% success rate

    if (!paymentSuccess) {
      return res.status(400).json({
        success: false,
        message: 'Payment failed. Please try again or use /api/payments/process for better payment options (MTN, Orange, Credit Card).',
      });
    }

    // Calculate access expiry date (course duration + access period in weeks)
    const accessPeriod = course.duration + course.accessPeriod;
    const accessExpiresAt = new Date();
    accessExpiresAt.setDate(accessExpiresAt.getDate() + accessPeriod * 7);

    // Create registration
    const registration = await Registration.create({
      user: req.user._id,
      course: course._id,
      paymentStatus: 'completed',
      paymentId: `PAY-LEGACY-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      paymentAmount: course.price,
      accessExpiresAt: accessExpiresAt.toISOString(),
    });

    // Update user's registered courses
    const updatedUser = await User.updateById(req.user._id, {
      registeredCourses: [...(req.user.registeredCourses || []), course._id],
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! For better payment options (MTN, Orange, Credit Card), use /api/payments/process endpoint.',
      data: registration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering for course',
      error: error.message,
    });
  }
}; 