const Material = require('../models/material.model');
const Course = require('../models/course.model');
const Registration = require('../models/registration.model');

/**
 * @desc    Get all materials for a course
 * @route   GET /api/materials/:courseId
 * @access  Private
 */
exports.getMaterials = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check if user is registered for this course
    const registration = await Registration.findByUserAndCourse(
      req.user._id,
      courseId
    );

    if (!registration) {
      return res.status(403).json({
        success: false,
        message: 'You are not registered for this course',
      });
    }

    // Check if access period has expired
    const now = new Date();
    const accessExpiresAt = new Date(registration.accessExpiresAt);
    if (now > accessExpiresAt) {
      return res.status(403).json({
        success: false,
        message: 'Your access to this course has expired',
      });
    }

    // Check if payment is completed
    if (registration.paymentStatus !== 'completed') {
      return res.status(403).json({
        success: false,
        message: 'Payment required to access course materials',
      });
    }

    // Get all materials for this course
    const materials = await Material.findByCourse(courseId, true);

    // Transform materials to view-only versions
    const viewableMaterials = materials.map((material) => {
      const viewableMaterial = { ...material };

      // Add access control headers for different material types
      switch (material.type) {
        case 'PDF':
          viewableMaterial.accessUrl = `/api/materials/view/${material._id}`;
          viewableMaterial.contentControl = 'PDF will be opened in viewer with copy disabled';
          break;
        case 'Video':
          viewableMaterial.accessUrl = `/api/materials/view/${material._id}`;
          viewableMaterial.contentControl = 'Video will be streamed with download disabled';
          break;
        case 'HTML':
          viewableMaterial.accessUrl = `/api/materials/view/${material._id}`;
          viewableMaterial.contentControl = 'HTML content with selection and right-click disabled';
          break;
        default:
          viewableMaterial.accessUrl = material.content;
          viewableMaterial.contentControl = 'Standard access';
      }

      // Remove direct content
      delete viewableMaterial.content;

      return viewableMaterial;
    });

    res.status(200).json({
      success: true,
      count: viewableMaterials.length,
      data: viewableMaterials,
      accessExpiresAt: registration.accessExpiresAt,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving materials',
      error: error.message,
    });
  }
};

/**
 * @desc    Get view-only version of a specific material
 * @route   GET /api/materials/view/:id
 * @access  Private
 */
exports.viewMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    // Get material
    const material = await Material.findById(id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found',
      });
    }

    // Get course
    const course = await Course.findById(material.course);

    // Check if user is registered for this course
    const registration = await Registration.findByUserAndCourse(
      req.user._id,
      material.course
    );

    if (!registration) {
      return res.status(403).json({
        success: false,
        message: 'You are not registered for this course',
      });
    }

    // Check if access period has expired
    const now = new Date();
    const accessExpiresAt = new Date(registration.accessExpiresAt);
    if (now > accessExpiresAt) {
      return res.status(403).json({
        success: false,
        message: 'Your access to this course has expired',
      });
    }

    // Check if payment is completed
    if (registration.paymentStatus !== 'completed') {
      return res.status(403).json({
        success: false,
        message: 'Payment required to access course materials',
      });
    }

    // Prepare view-only response based on material type
    switch (material.type) {
      case 'PDF':
        // For a real app, this would involve serving the PDF with content-disposition: inline
        // and possibly through a specialized PDF viewer with copy protection
        res.status(200).send(`
          <html>
            <head>
              <title>${material.title}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                .content { padding: 20px; }
                .watermark { position: fixed; bottom: 10px; right: 10px; opacity: 0.5; }
              </style>
              <script>
                // Disable right-click
                document.addEventListener('contextmenu', event => event.preventDefault());
                // Disable text selection
                document.addEventListener('selectstart', event => event.preventDefault());
              </script>
            </head>
            <body>
              <div class="content">
                <h1>${material.title}</h1>
                <p>PDF Content would be displayed here in a secure viewer</p>
                <p>${material.description}</p>
                <p>This is a mock view of the PDF content.</p>
              </div>
              <div class="watermark">
                © Course Platform - ${req.user.email}
              </div>
            </body>
          </html>
        `);
        break;

      case 'Video':
        // For a real app, this would involve secure video streaming
        res.status(200).send(`
          <html>
            <head>
              <title>${material.title}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                .content { padding: 20px; }
                .watermark { position: fixed; bottom: 10px; right: 10px; opacity: 0.5; }
              </style>
              <script>
                // Disable right-click
                document.addEventListener('contextmenu', event => event.preventDefault());
              </script>
            </head>
            <body>
              <div class="content">
                <h1>${material.title}</h1>
                <p>Video would be streamed here with download disabled</p>
                <p>${material.description}</p>
                <p>This is a mock view of the video content.</p>
              </div>
              <div class="watermark">
                © Course Platform - ${req.user.email}
              </div>
            </body>
          </html>
        `);
        break;

      case 'HTML':
        // For a real app, the HTML content would be rendered with scripts to prevent copying
        res.status(200).send(`
          <html>
            <head>
              <title>${material.title}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                .content { padding: 20px; }
                .watermark { position: fixed; bottom: 10px; right: 10px; opacity: 0.5; }
              </style>
              <script>
                // Disable right-click
                document.addEventListener('contextmenu', event => event.preventDefault());
                // Disable text selection
                document.addEventListener('selectstart', event => event.preventDefault());
              </script>
            </head>
            <body>
              <div class="content">
                <h1>${material.title}</h1>
                ${material.content}
              </div>
              <div class="watermark">
                © Course Platform - ${req.user.email}
              </div>
            </body>
          </html>
        `);
        break;

      default:
        // For links and other types, just redirect
        return res.redirect(material.content);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving material',
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new material
 * @route   POST /api/materials/:courseId
 * @access  Private (Admin only)
 */
exports.createMaterial = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Create material with course ID
    const material = await Material.create({
      ...req.body,
      course: courseId,
    });

    res.status(201).json({
      success: true,
      data: material,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating material',
      error: error.message,
    });
  }
}; 