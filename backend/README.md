# ACRMS Backend

Node.js/Express backend API for the ACRMS (Abelov Customer Relationship Management System) application.

## Features

- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Database**: MongoDB with Mongoose ODM
- **API**: RESTful API endpoints for all resources
- **Security**: Helmet, CORS, rate limiting
- **Validation**: Express-validator for input validation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Security**: Helmet, CORS, express-rate-limit

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile

### Assets
- `GET /api/assets` - Get all user assets
- `GET /api/assets/:id` - Get asset by ID
- `POST /api/assets` - Create new asset
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset

### Service Requests
- `GET /api/service-requests` - Get all user service requests
- `GET /api/service-requests/:id` - Get service request by ID
- `POST /api/service-requests` - Create new service request
- `PUT /api/service-requests/:id` - Update service request
- `DELETE /api/service-requests/:id` - Delete service request

### Notifications
- `GET /api/notifications` - Get all user notifications
- `POST /api/notifications` - Create new notification
- `PUT /api/notifications/:id/read` - Mark notification as read
- `DELETE /api/notifications/:id` - Delete notification

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/acrms

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Environment
NODE_ENV=development
```

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (see above)

4. Start the development server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3001`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Database Models

The application uses the following MongoDB collections:

- **Users**: User accounts with authentication
- **Profiles**: User profile information
- **UserRoles**: User role assignments
- **Assets**: IT assets management
- **ServiceRequests**: Service request tickets
- **Notifications**: User notifications
- **ActivityLogs**: Audit logs

## Authentication

The API uses JWT (JSON Web Token) based authentication:

1. User registers/logs in to receive a JWT token
2. Token is stored in localStorage on the frontend
3. Subsequent requests include the token in the Authorization header
4. Server validates the token on protected routes

## Security Features

- **Password Hashing**: bcryptjs with 12 salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for frontend origin
- **Helmet**: Security headers
- **Input Validation**: Request validation with express-validator