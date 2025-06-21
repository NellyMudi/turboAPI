# Course Management API

A RESTful API built with Node.js, Express, and a simple JSON file-based database for managing courses, user registration, payments, and protected course materials.

## Features

- 🔐 **Authentication**: JWT-based authentication with signup and login endpoints
- 📘 **Course Management**: Create and browse courses with detailed information
- 💳 **Multiple Payment Methods**: Support for MTN Mobile Money, Orange Money, and Credit Card payments
- 📁 **Course Materials**: Protected access to course materials based on registration and payment status
- 📝 **API Documentation**: Swagger UI for exploring and testing the API
- 📋 **Simple Database**: JSON file-based storage that requires no external database setup
- 📊 **Payment Analytics**: Track payment statistics and history

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user profile (protected)

### Courses

- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create a new course (admin only)
- `POST /api/courses/:id/register` - Register for a course (protected)

### Course Materials

- `GET /api/materials/:courseId` - Get materials for a course (protected)
- `GET /api/materials/view/:id` - View a specific material in protected format (protected)
- `POST /api/materials/:courseId` - Create a new material for a course (admin only)

### Payments

- `POST /api/payments/process` - Process course payment with MTN, Orange, or Credit Card (protected)
- `GET /api/payments/history` - Get user's payment history (protected)
- `GET /api/payments/:id` - Get payment status by ID (protected)
- `GET /api/payments` - Get all payments (admin only)
- `GET /api/payments/stats` - Get payment statistics (admin only)
- `POST /api/payments/:id/refund` - Refund a payment (admin only)

## Setup and Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/course-api.git
cd course-api
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment variables**

Create a `.env` file in the root directory with the following variables:

```
PORT=3000
JWT_SECRET=your_super_secret_key_for_jwt
JWT_EXPIRE=30d
```

4. **Run the server**

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Database

This API uses a JSON file-based database stored in the `src/data` directory. The following collections are used:

- `users.json` - User information
- `courses.json` - Course details
- `materials.json` - Course materials
- `registrations.json` - Course registrations
- `payments.json` - Payment transactions and history

This approach eliminates the need for setting up a separate database, making the project easy to run and test.

## API Documentation

Once the server is running, you can access the Swagger documentation at:

```
http://localhost:3000/api-docs
```

## Testing the API

You can use tools like Postman or the Swagger UI to test the API endpoints.

Example authentication flow:

1. Register a user with `POST /api/auth/signup`
2. Login with `POST /api/auth/login` to get a JWT token
3. Use the token in the Authorization header for protected routes: `Bearer YOUR_TOKEN`

## Payment Methods

The API supports three payment methods:

### MTN Mobile Money
```json
{
  "courseId": "course-id-here",
  "paymentMethod": "MTN",
  "paymentDetails": {
    "phoneNumber": "+237123456789"
  }
}
```

### Orange Money
```json
{
  "courseId": "course-id-here",
  "paymentMethod": "Orange",
  "paymentDetails": {
    "phoneNumber": "+237123456789"
  }
}
```

### Credit Card
```json
{
  "courseId": "course-id-here",
  "paymentMethod": "Credit Card",
  "paymentDetails": {
    "cardNumber": "4111111111111111",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cvv": "123",
    "cardholderName": "John Doe"
  }
}
```

All payment methods are mock implementations with the following success rates:
- MTN Mobile Money: 90% success rate
- Orange Money: 85% success rate
- Credit Card: 95% success rate 