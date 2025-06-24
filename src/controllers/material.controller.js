const Material = require('../models/material.model');
const Course = require('../models/course.model');
const Registration = require('../models/registration.model');

/**
 * Generate advanced material viewer HTML
 * @param {object} material - Material object
 * @param {object} user - User object  
 * @param {object} course - Course object
 * @returns {string} - HTML content
 */
function generateAdvancedViewer(material, user, course) {
  const baseStyles = `
    <style>
      :root {
        --primary-color: #4f46e5;
        --secondary-color: #64748b;
        --success-color: #10b981;
        --warning-color: #f59e0b;
        --error-color: #ef4444;
        --background: #ffffff;
        --surface: #f8fafc;
        --text-primary: #1e293b;
        --text-secondary: #64748b;
        --border: #e2e8f0;
        --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        --radius: 0.5rem;
        --transition: all 0.2s ease;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: var(--background);
        color: var(--text-primary);
        line-height: 1.6;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }

      .viewer-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        overflow: hidden;
      }

      .viewer-header {
        background: var(--surface);
        border-bottom: 1px solid var(--border);
        padding: 1rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
      }

      .viewer-title {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .viewer-title h1 {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .viewer-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .viewer-controls {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }

      .btn {
        padding: 0.5rem 1rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: var(--background);
        color: var(--text-primary);
        cursor: pointer;
        transition: var(--transition);
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
      }

      .btn:hover {
        background: var(--surface);
        border-color: var(--primary-color);
      }

      .btn-primary {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      .btn-primary:hover {
        background: #3730a3;
      }

      .viewer-content {
        flex: 1;
        display: flex;
        overflow: hidden;
      }

      .main-content {
        flex: 1;
        overflow: auto;
        padding: 2rem;
        background: var(--background);
      }

      .sidebar {
        width: 300px;
        background: var(--surface);
        border-left: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        transition: var(--transition);
      }

      .sidebar.collapsed {
        width: 0;
        overflow: hidden;
      }

      .sidebar-tabs {
        display: flex;
        border-bottom: 1px solid var(--border);
      }

      .sidebar-tab {
        flex: 1;
        padding: 0.75rem;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 0.875rem;
        color: var(--text-secondary);
        transition: var(--transition);
      }

      .sidebar-tab.active {
        color: var(--primary-color);
        background: var(--background);
        border-bottom: 2px solid var(--primary-color);
      }

      .sidebar-content {
        flex: 1;
        padding: 1rem;
        overflow: auto;
      }

      .notes-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        height: 100%;
      }

      .notes-input {
        width: 100%;
        min-height: 120px;
        padding: 0.75rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        resize: vertical;
        font-family: inherit;
        font-size: 0.875rem;
      }

      .notes-list {
        flex: 1;
        overflow: auto;
      }

      .note-item {
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        background: var(--background);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        font-size: 0.875rem;
      }

      .note-time {
        color: var(--text-secondary);
        font-size: 0.75rem;
        margin-bottom: 0.25rem;
      }

      .progress-bar {
        width: 100%;
        height: 4px;
        background: var(--border);
        border-radius: 2px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: var(--primary-color);
        transition: width 0.3s ease;
        width: 0%;
      }

      .content-display {
        max-width: 100%;
        line-height: 1.8;
      }

      .content-display h1, .content-display h2, .content-display h3 {
        margin: 1.5rem 0 1rem 0;
        color: var(--text-primary);
      }

      .content-display p {
        margin-bottom: 1rem;
        text-align: justify;
      }

      .content-display img {
        max-width: 100%;
        height: auto;
        border-radius: var(--radius);
        margin: 1rem 0;
      }

      .video-container {
        position: relative;
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
        background: #000;
        border-radius: var(--radius);
        overflow: hidden;
      }

      .video-placeholder {
        width: 100%;
        aspect-ratio: 16/9;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.25rem;
        text-align: center;
        padding: 2rem;
      }

      .document-viewer {
        background: var(--surface);
        border-radius: var(--radius);
        padding: 2rem;
        box-shadow: var(--shadow);
        max-width: 800px;
        margin: 0 auto;
      }

      .zoom-controls {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        justify-content: center;
      }

      .watermark {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: var(--radius);
        font-size: 0.75rem;
        pointer-events: none;
        z-index: 1000;
      }

      .fullscreen-btn {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1001;
      }

      @media (max-width: 768px) {
        .viewer-header {
          padding: 1rem;
          flex-direction: column;
          gap: 1rem;
        }

        .viewer-content {
          flex-direction: column;
        }

        .sidebar {
          width: 100%;
          height: 300px;
          border-left: none;
          border-top: 1px solid var(--border);
        }

        .main-content {
          padding: 1rem;
        }
      }
    </style>
  `;

  const baseScripts = `
    <script>
      // Security measures
      document.addEventListener('contextmenu', e => e.preventDefault());
      document.addEventListener('selectstart', e => e.preventDefault());
      document.addEventListener('keydown', e => {
        if (e.ctrlKey && (e.key === 's' || e.key === 'a' || e.key === 'p' || e.key === 'c')) {
          e.preventDefault();
        }
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
          e.preventDefault();
        }
      });

      // Progress tracking
      let viewStartTime = Date.now();
      let totalViewTime = 0;
      let progressInterval;

      function startProgressTracking() {
        progressInterval = setInterval(() => {
          totalViewTime += 1;
          updateProgress();
        }, 1000);
      }

      function updateProgress() {
        const progress = Math.min((totalViewTime / 300) * 100, 100); // 5 minutes = 100%
        document.querySelector('.progress-fill').style.width = progress + '%';
      }

      // Sidebar functionality
      function toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('collapsed');
      }

      function showSidebarTab(tabName) {
        document.querySelectorAll('.sidebar-tab').forEach(tab => {
          tab.classList.remove('active');
        });
        document.querySelectorAll('.sidebar-panel').forEach(panel => {
          panel.style.display = 'none';
        });
        
        document.querySelector('[data-tab="' + tabName + '"]').classList.add('active');
        document.querySelector('[data-panel="' + tabName + '"]').style.display = 'block';
      }

      // Notes functionality
      let notes = JSON.parse(localStorage.getItem('course-notes-${material._id}') || '[]');

      function saveNote() {
        const noteText = document.querySelector('.notes-input').value.trim();
        if (!noteText) return;

        const note = {
          id: Date.now(),
          text: noteText,
          timestamp: new Date().toLocaleString(),
          materialId: '${material._id}'
        };

        notes.unshift(note);
        localStorage.setItem('course-notes-${material._id}', JSON.stringify(notes));
        displayNotes();
        document.querySelector('.notes-input').value = '';
      }

      function displayNotes() {
        const container = document.querySelector('.notes-list');
        if (!container) return;

        container.innerHTML = notes.map(note => \`
          <div class="note-item">
            <div class="note-time">\${note.timestamp}</div>
            <div>\${note.text}</div>
          </div>
        \`).join('');
      }

      // Zoom functionality
      let zoomLevel = 100;

      function zoomIn() {
        zoomLevel = Math.min(zoomLevel + 25, 200);
        applyZoom();
      }

      function zoomOut() {
        zoomLevel = Math.max(zoomLevel - 25, 50);
        applyZoom();
      }

      function resetZoom() {
        zoomLevel = 100;
        applyZoom();
      }

      function applyZoom() {
        const content = document.querySelector('.content-display');
        if (content) {
          content.style.fontSize = (zoomLevel / 100) + 'em';
        }
      }

      // Fullscreen functionality
      function toggleFullscreen() {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      }

      // Initialize
      document.addEventListener('DOMContentLoaded', function() {
        startProgressTracking();
        displayNotes();
        showSidebarTab('info');
      });

      // Cleanup on page unload
      window.addEventListener('beforeunload', function() {
        clearInterval(progressInterval);
      });
    </script>
  `;

  let contentHtml = '';
  let sidebarContent = '';

  switch (material.type) {
    case 'PDF':
      contentHtml = `
        <div class="document-viewer">
          <div class="zoom-controls">
            <button class="btn" onclick="zoomOut()">🔍−</button>
            <button class="btn" onclick="resetZoom()">100%</button>
            <button class="btn" onclick="zoomIn()">🔍+</button>
          </div>
          <div class="content-display">
            <h1>📄 ${material.title}</h1>
            <p><strong>Document Type:</strong> PDF Document</p>
            <p><strong>Description:</strong> ${material.description}</p>
            <div style="background: var(--surface); padding: 2rem; border-radius: var(--radius); margin: 2rem 0; text-align: center;">
              <h2>📋 Document Content</h2>
              <p>This is a demonstration of the PDF viewing experience. In a production environment, this would display the actual PDF content using a secure viewer with advanced features like:</p>
              <ul style="text-align: left; max-width: 500px; margin: 1rem auto;">
                <li>🔒 Content protection and watermarking</li>
                <li>📱 Responsive viewing on all devices</li>
                <li>🔍 Text search and highlighting</li>
                <li>📑 Page navigation and bookmarks</li>
                <li>💾 Progress saving and resume</li>
                <li>📝 Annotation and note-taking tools</li>
              </ul>
              <p style="margin-top: 2rem; font-style: italic;">The PDF content would be securely rendered here with copy protection and access controls.</p>
            </div>
          </div>
        </div>
      `;
      break;

    case 'Video':
      contentHtml = `
        <div class="video-container">
          <div class="video-placeholder">
            <div>
              <h2>🎥 ${material.title}</h2>
              <p>Secure Video Streaming</p>
              <p style="font-size: 0.9rem; margin-top: 1rem;">In production, this would be a secure video player with:</p>
              <div style="font-size: 0.8rem; margin-top: 0.5rem;">
                ▶️ HD/4K streaming • 🚫 Download protection • 📱 Mobile optimized<br/>
                ⏯️ Custom controls • 📊 Analytics • 🔄 Resume playback
              </div>
            </div>
          </div>
        </div>
        <div style="margin-top: 2rem;">
          <h3>Video Details</h3>
          <p><strong>Description:</strong> ${material.description}</p>
        </div>
      `;
      break;

    case 'HTML':
      contentHtml = `
        <div class="content-display">
          <h1>${material.title}</h1>
          <div style="background: var(--surface); padding: 1rem; border-radius: var(--radius); margin: 1rem 0;">
            <strong>Description:</strong> ${material.description}
          </div>
          ${material.content}
        </div>
      `;
      break;

    default:
      contentHtml = `
        <div class="content-display">
          <h1>🔗 ${material.title}</h1>
          <p><strong>Description:</strong> ${material.description}</p>
          <p><strong>Type:</strong> ${material.type}</p>
          <div style="text-align: center; margin: 2rem 0;">
            <a href="${material.content}" target="_blank" class="btn btn-primary">
              🌐 Open External Content
            </a>
          </div>
        </div>
      `;
  }

  sidebarContent = `
    <div class="sidebar-panel" data-panel="info" style="display: block;">
      <h3>📚 Course Information</h3>
      <div style="margin: 1rem 0;">
        <strong>Course:</strong> ${course.title}<br/>
        <strong>Instructor:</strong> ${course.instructor}<br/>
        <strong>Level:</strong> ${course.level}
      </div>
      
      <h3>📋 Material Details</h3>
      <div style="margin: 1rem 0;">
        <strong>Type:</strong> ${material.type}<br/>
        <strong>Order:</strong> ${material.order || 0}<br/>
        <strong>Status:</strong> ${material.isPublished ? '✅ Published' : '⏳ Draft'}
      </div>

      <h3>📊 Progress</h3>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
      <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.5rem;">
        Track your viewing progress
      </p>
    </div>

    <div class="sidebar-panel notes-container" data-panel="notes" style="display: none;">
      <h3>📝 My Notes</h3>
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <textarea class="notes-input" placeholder="Add your notes here..."></textarea>
        <button class="btn btn-primary" onclick="saveNote()">💾 Save Note</button>
      </div>
      <div class="notes-list"></div>
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${material.title} - Course Viewer</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
      ${baseStyles}
    </head>
    <body>
      <div class="viewer-container">
        <header class="viewer-header">
          <div class="viewer-title">
            <h1>${material.title}</h1>
            <div class="viewer-meta">
              <span>📚 ${course.title}</span>
              <span>👨‍🏫 ${course.instructor}</span>
              <span>📁 ${material.type}</span>
            </div>
          </div>
          <div class="viewer-controls">
            <button class="btn" onclick="toggleSidebar()">
              <i class="fas fa-sidebar"></i> Toggle Sidebar
            </button>
            <button class="btn" onclick="window.close()">
              <i class="fas fa-times"></i> Close
            </button>
          </div>
        </header>

        <div class="viewer-content">
          <main class="main-content">
            ${contentHtml}
          </main>

          <aside class="sidebar">
            <div class="sidebar-tabs">
              <button class="sidebar-tab active" data-tab="info" onclick="showSidebarTab('info')">
                📚 Info
              </button>
              <button class="sidebar-tab" data-tab="notes" onclick="showSidebarTab('notes')">
                📝 Notes
              </button>
            </div>
            <div class="sidebar-content">
              ${sidebarContent}
            </div>
          </aside>
        </div>
      </div>

      <button class="btn fullscreen-btn" onclick="toggleFullscreen()">
        <i class="fas fa-expand"></i>
      </button>

      <div class="watermark">
        © ${course.title} - ${user.name} (${user.email})
      </div>

      ${baseScripts}
    </body>
    </html>
  `;
}

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

    // Generate enhanced viewer HTML
    const viewerHtml = generateAdvancedViewer(material, req.user, course);
    res.status(200).send(viewerHtml);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving material',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all materials for a course (Admin only - bypasses registration check)
 * @route   GET /api/materials/admin/:courseId
 * @access  Private (Admin only)
 */
exports.getAdminMaterials = async (req, res) => {
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

    // Get all materials for this course (admin access bypasses registration check)
    const materials = await Material.findByCourse(courseId, false); // false = include unpublished

    res.status(200).json({
      success: true,
      count: materials.length,
      data: materials,
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

/**
 * @desc    Update a material
 * @route   PUT /api/materials/:id
 * @access  Private (Admin only)
 */
exports.updateMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found',
      });
    }

    const updatedMaterial = await Material.updateById(req.params.id, req.body);

    res.status(200).json({
      success: true,
      data: updatedMaterial,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating material',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a material
 * @route   DELETE /api/materials/:id
 * @access  Private (Admin only)
 */
exports.deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found',
      });
    }

    await Material.deleteById(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Material deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting material',
      error: error.message,
    });
  }
}; 