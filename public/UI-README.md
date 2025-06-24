# Course Management Platform UI

A modern, responsive web interface for the Course Management API that provides a complete user experience for course browsing, registration, payments, and materials access.

## Features

🎨 **Modern Design**: Clean, responsive interface with smooth animations and modern styling
🔐 **Authentication**: Complete login/signup system with JWT token management
📚 **Course Catalog**: Browse available courses with detailed information
💳 **Multi-Payment Support**: MTN Mobile Money, Orange Money, and Credit Card payments
📊 **User Dashboard**: Track enrolled courses and payment history
📁 **Materials Access**: Secure access to course materials after enrollment
👑 **Admin Panel**: Comprehensive admin dashboard for content management (admin users only)
📱 **Mobile Responsive**: Fully optimized for desktop, tablet, and mobile devices

## Getting Started

### Prerequisites

Make sure your Course Management API is running on `http://localhost:3000`.

### Accessing the UI

1. **Start the API server**:
   ```bash
   npm start
   ```

2. **Open your browser** and navigate to:
   ```
   http://localhost:3000
   ```

3. **The UI will be served automatically** from the API server.

## Using the Interface

### 1. **Home Page**
- Landing page with platform overview
- Call-to-action buttons to browse courses or sign up
- Responsive hero section with engaging design

### 2. **Authentication**

#### Sign Up
- Click "Sign Up" button in the header
- Fill in your full name, email, and password
- Account is created automatically with JWT authentication

#### Login
- Click "Login" button in the header
- Enter your email and password
- Authentication persists across browser sessions

### 3. **Browse Courses**
- Navigate to "Courses" section
- View course cards with titles, descriptions, and prices
- Click on any course card to view detailed information

### 4. **Course Registration & Payment**

#### View Course Details
- Click on a course to open the detailed modal
- View course information, instructor, duration, and start date
- Registration button appears for logged-in users

#### Payment Process
1. Click "Register for Course"
2. Select payment method:
   - **MTN Mobile Money**: Enter phone number
   - **Orange Money**: Enter phone number  
   - **Credit Card**: Enter card details
3. Click "Process Payment"
4. Successful payments automatically register you for the course

#### Payment Methods Demo Data
- **MTN Mobile Money**: Use any phone number format (+237XXXXXXXXX)
- **Orange Money**: Use any phone number format (+237XXXXXXXXX)
- **Credit Card**: Use test card number `4111111111111111`, any future expiry date, and any CVV

### 5. **User Dashboard**

#### My Courses
- View all courses you're enrolled in
- Access course materials directly
- Track your learning progress

#### Payment History
- Complete history of all payments
- Payment status indicators (Success, Pending, Failed)
- Course and amount details

### 6. **Course Materials & Enhanced Viewer**

#### Material Access
- Accessible only after successful course registration and payment
- Enhanced material cards with large icons and feature highlights
- Organized by course with clear material listings
- Secure access with authentication verification

#### Enhanced Viewing Experience ✨
The platform features a state-of-the-art material viewer with professional-grade features:

**🔐 Security & Protection**
- Content watermarking with user identification
- Copy/paste protection and right-click disabled
- Screenshot prevention and developer tools blocking
- Secure content delivery with access controls

**📊 Learning Analytics**
- Real-time progress tracking (5-minute sessions = 100%)
- Viewing time monitoring and statistics
- Learning behavior analytics
- Resume capability for interrupted sessions

**📝 Interactive Features**
- Personal note-taking system with local storage
- Notes synchronized across materials
- Timestamped annotations for easy reference
- Search and organize your study notes

**🔍 Advanced Controls**
- Zoom in/out functionality (50% to 200%)
- Fullscreen mode for distraction-free learning
- Responsive design optimized for all devices
- Touch-friendly controls for mobile devices

**📱 Multi-Device Experience**
- Seamless viewing across desktop, tablet, and mobile
- Adaptive layout for different screen sizes
- Touch gestures support for mobile interaction
- Optimized performance for all devices

**🎨 Professional Interface**
- Modern, clean design with intuitive navigation
- Tabbed sidebar for information and notes
- Contextual course and material information
- Professional-grade PDF, video, and document viewers

**📺 Content Type Support**
- **PDF Documents**: Secure viewer with zoom and navigation
- **Video Content**: Protected streaming with custom controls
- **HTML Content**: Interactive lessons with rich formatting
- **External Links**: Secure access to external resources

### 7. **Admin Dashboard** (Admin Users Only)

The admin dashboard provides comprehensive management capabilities for administrators.

#### Accessing the Admin Panel
- Log in with an admin account (user role must be 'admin')
- Click "Admin" in the navigation menu (visible only to admin users)

#### Admin Features

##### Course Management
- **View All Courses**: Complete list of courses with detailed information
- **Create New Courses**: Full course creation form with:
  - Title, description, and instructor information
  - Pricing and duration settings
  - Category and difficulty level selection
  - Access period configuration
- **Course Analytics**: Individual course performance metrics
- **Course Actions**: Edit, manage, and view analytics for each course

##### Material Management
- **Select Course**: Choose any course to manage its materials
- **Add Materials**: Create new course materials with:
  - Title and description
  - Material type (PDF, Video, HTML, Link, Other)
  - Content or URL specification
  - Order and publication status
- **Material Organization**: View and manage all materials for selected courses
- **Edit/Delete**: Modify or remove existing materials

##### Analytics Dashboard
- **Revenue Analytics**: Total revenue and payment statistics
- **Course Analytics**: Number of active courses and enrollment data
- **User Analytics**: Total registered users and growth metrics
- **Payment Analytics**: Success rates and payment method performance
- **Growth Metrics**: Monthly growth trends and performance indicators

#### Admin Test Accounts
Use these pre-configured admin accounts for testing:
- **Email**: `admin@example.com`, **Password**: `password123`
- **Email**: `joele@gmail.com`, **Password**: (contact administrator)
- **Email**: `nmbeinellymudi@gmail.com`, **Password**: (contact administrator)

#### Admin Security
- Admin features are role-based and secured at both UI and API levels
- Admin navigation is hidden from non-admin users
- All admin API calls require proper authentication and authorization
- Material management includes draft and published status controls

## UI Components

### Navigation
- **Fixed header** with responsive navigation
- **Mobile-friendly** hamburger menu for smaller screens
- **Authentication state management** showing appropriate buttons

### Modals
- **Login/Signup modals** with form validation
- **Course details modal** with comprehensive information
- **Payment modal** with dynamic forms based on payment method
- **Materials modal** for accessing course content

### Notifications
- **Success notifications** for completed actions
- **Error notifications** for failed operations
- **Warning notifications** for important information
- **Auto-dismiss** after 5 seconds

### Responsive Design
- **Desktop**: Full layout with sidebar navigation
- **Tablet**: Adapted layout with collapsed navigation
- **Mobile**: Optimized for touch with mobile-first design

## API Integration

The UI seamlessly integrates with all API endpoints:

- **Authentication**: `/api/auth/login`, `/api/auth/signup`, `/api/auth/me`
- **Courses**: `/api/courses`, `/api/courses/:id`, `/api/courses/:id/register`
- **Payments**: `/api/payments/process`, `/api/payments/history`
- **Materials**: `/api/materials/:courseId`, `/api/materials/view/:id`

## Browser Compatibility

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## Technical Details

### Architecture
- **Vanilla JavaScript**: No framework dependencies for maximum performance
- **CSS Grid & Flexbox**: Modern layout techniques
- **CSS Custom Properties**: Consistent theming system
- **Fetch API**: Modern HTTP requests with proper error handling

### Security Features
- **JWT Token Management**: Secure authentication with localStorage
- **CORS Handling**: Proper cross-origin request handling
- **Input Validation**: Client-side validation for all forms
- **Secure Material Access**: Protected routes with authentication verification

### Performance Optimizations
- **Lazy Loading**: Content loaded only when needed
- **Parallel API Calls**: Multiple requests processed simultaneously
- **Optimized Images**: FontAwesome icons for scalability
- **Minimal Dependencies**: Only essential external resources

## Customization

### Theming
The UI uses CSS custom properties for easy theming. Key variables in `styles.css`:

```css
:root {
    --primary-color: #4f46e5;
    --secondary-color: #64748b;
    --success-color: #10b981;
    --error-color: #ef4444;
    /* ... more variables */
}
```

### API Configuration
Update the API base URL in `script.js`:

```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

## Troubleshooting

### Common Issues

1. **UI not loading**: Ensure the API server is running on port 3000
2. **Login issues**: Check API credentials and network connectivity
3. **Payment failures**: Verify API payment processing is working correctly
4. **Materials not accessible**: Ensure user is registered for the course

### Development Mode
- Open browser Developer Tools (F12) for debugging
- Check Console for JavaScript errors
- Check Network tab for API request/response details

## Contributing

When making changes to the UI:

1. **Maintain responsive design** across all screen sizes
2. **Follow the existing code style** and naming conventions
3. **Test all user flows** thoroughly
4. **Update this documentation** for any new features

## License

This UI is part of the Course Management Platform and follows the same licensing terms as the main project. 