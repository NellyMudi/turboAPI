const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Sample data
const sampleData = {
  users: [
    {
      _id: uuidv4(),
      name: 'Admin User',
      email: 'admin@example.com',
      // Password: admin123
      password: '$2a$10$AESF3dOBpqGkAkqshwPcw.T.VpWynzOyKGcN/zHGlUgScJx9nkPC2',
      role: 'admin',
      registeredCourses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: uuidv4(),
      name: 'Test User',
      email: 'user@example.com',
      // Password: password123
      password: '$2a$10$iw5Y/b6g/GqU3yGSpxtG5.FkxHLWOagqfNxV6QyUjYvxuwOB2aJhW',
      role: 'user',
      registeredCourses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  courses: [
    {
      _id: uuidv4(),
      title: 'JavaScript Fundamentals',
      description: 'Learn the basics of JavaScript, from variables to advanced concepts.',
      price: 99.99,
      duration: 4, // weeks
      accessPeriod: 12, // weeks
      instructor: 'John Doe',
      category: 'Programming',
      level: 'Beginner',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: uuidv4(),
      title: 'React for Beginners',
      description: 'Start building modern applications with React.',
      price: 149.99,
      duration: 6, // weeks
      accessPeriod: 16, // weeks
      instructor: 'Jane Smith',
      category: 'Programming',
      level: 'Intermediate',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: uuidv4(),
      title: 'Digital Marketing Strategy',
      description: 'Comprehensive guide to digital marketing in the modern world.',
      price: 199.99,
      duration: 8, // weeks
      accessPeriod: 24, // weeks
      instructor: 'Mark Johnson',
      category: 'Marketing',
      level: 'Beginner',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  materials: [],
  registrations: [],
  payments: [],
};

// Add materials for each course
sampleData.courses.forEach((course) => {
  // Add PDF material
  sampleData.materials.push({
    _id: uuidv4(),
    title: `${course.title} - Course Guide`,
    description: `A comprehensive guide for the ${course.title} course.`,
    type: 'PDF',
    content: 'https://example.com/sample.pdf',
    course: course._id,
    order: 1,
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Add Video material
  sampleData.materials.push({
    _id: uuidv4(),
    title: `${course.title} - Introduction Video`,
    description: `An introductory video for the ${course.title} course.`,
    type: 'Video',
    content: 'https://example.com/sample.mp4',
    course: course._id,
    order: 2,
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Add HTML material
  sampleData.materials.push({
    _id: uuidv4(),
    title: `${course.title} - Interactive Tutorial`,
    description: `An interactive tutorial for the ${course.title} course.`,
    type: 'HTML',
    content: '<h1>Interactive Tutorial</h1><p>This is a sample interactive tutorial.</p>',
    course: course._id,
    order: 3,
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
});

// Write data to files
Object.entries(sampleData).forEach(([collection, data]) => {
  const filePath = path.join(dataDir, `${collection}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Initialized ${collection} with ${data.length} records`);
});

console.log('Database initialized successfully!');
console.log('\nSample Credentials:');
console.log('Admin: admin@example.com / admin123');
console.log('User: user@example.com / password123');
console.log('\nRun the API with: npm run dev'); 