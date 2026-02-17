# Face Recognition Attendance System

A modern attendance management system using facial recognition technology for contactless check-in and check-out.

## Overview

This project is a comprehensive attendance management solution that utilizes facial recognition for contact-free attendance tracking. Built with a modern tech stack including React, Node.js, Express, and MongoDB, this system provides a secure and efficient way to track attendance for organizations, educational institutions, or businesses.

## Features

### User Features
- **Facial Recognition**: Register and authenticate using face detection technology
- **Contactless Attendance**: Mark attendance without physical contact
- **Real-time Status**: Check current attendance status and history
- **Profile Management**: Update personal information and face data
- **Attendance Statistics**: View attendance metrics and trends
- **Mobile Responsive**: Use on any device with a camera

### Admin Features
- **User Management**: Add, edit, and manage user accounts
- **Department Management**: Create and manage organizational departments
- **Attendance Verification**: Verify or reject attendance records
- **Reporting**: Generate and export attendance reports
- **Analytics Dashboard**: View attendance patterns and statistics
- **Settings Control**: Configure system parameters and policies

## Project Structure

The project is organized into three main components:

```
/Face Recognition Attendance
│
├── /client           # User-facing frontend application
│   ├── /src
│   ├── /public
│   └── package.json
│
├── /admin            # Admin dashboard frontend application
│   ├── /src
│   ├── /public
│   └── package.json
│
└── /server           # Backend API server
    ├── /models
    ├── /routes
    ├── /middleware
    ├── /utils
    ├── /config
    └── package.json
```

## Technology Stack

### Frontend
- **React**: UI library for building user interfaces
- **TailwindCSS**: Utility-first CSS framework for styling
- **TensorFlow.js**: Machine learning library for face detection
- **BlazeFace**: Lightweight face detection model
- **Webcam**: Real-time camera integration
- **Axios**: HTTP client for API requests
- **React Router**: Client-side routing

### Backend
- **Node.js**: JavaScript runtime for server-side code
- **Express**: Web application framework
- **MongoDB**: NoSQL database for storing data
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Tokens for authentication
- **Bcrypt**: Password hashing for security
- **ImageKit**: Cloud storage for face images
- **JSON2CSV**: Data export functionality

### DevOps
- **Vite**: Frontend build tool and development server
- **ESLint**: Code quality and style checking
- **Nodemon**: Development server with auto-reload

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- ImageKit account for image storage
- Modern web browser with camera access

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/face-recognition-attendance.git
   cd face-recognition-attendance
   ```

2. **Install server dependencies and set up environment**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # then update values in .env
   ```

3. **Install client application dependencies**
   ```bash
   cd ../client
   npm install
   cp .env.example .env
   ```

4. **Install admin dashboard dependencies**
   ```bash
   cd ../admin
   npm install
   cp .env.example .env
   ```

5. **Start the development servers**
   ```bash
   # In the server directory
   npm run dev
   
   # In the client directory
   npm run dev
   
   # In the admin directory
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the server directory with the following variables:

```
# Server Configuration
PORT=4000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/face-attendance

# JWT Secret
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRY=7d

# ImageKit Configuration
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_endpoint
```

## API Documentation

The API documentation is available at `/api/docs` when running the server locally. It provides detailed information about available endpoints, request/response formats, and authentication requirements.

## Deployment

### Server Deployment
- Deploy the Node.js server to platforms like Heroku, AWS, or DigitalOcean
- Set up environment variables for production
- Configure a production MongoDB database

### Client Deployment
- Build the production React applications:
  ```bash
  cd client
  npm run build
  ```
- Deploy the built files to static hosting services like Netlify, Vercel, or AWS S3

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [TensorFlow.js](https://www.tensorflow.org/js) for machine learning capabilities
- [BlazeFace](https://github.com/tensorflow/tfjs-models/tree/master/blazeface) for facial detection
- [TailwindCSS](https://tailwindcss.com/) for UI styling
- [React](https://reactjs.org/) for frontend framework
- [MongoDB](https://www.mongodb.com/) for database
- [Express](https://expressjs.com/) for API framework
- [Node.js](https://nodejs.org/) for server runtime


## AWS Hosting (Recommended)

For production, host the API on EC2 with Nginx + PM2 and host both frontend apps on S3 + CloudFront. Use Route 53 and ACM for DNS + TLS. See `DEPLOYMENT.md` for a complete step-by-step setup.


## Runtime health checks

- API health endpoint: `GET /health`
- API namespaced health endpoint: `GET /api/health`


## Local Hosting (Recommended for now)

Run all services locally from the project root:

```bash
npm install
npm run local:all
```

Default local URLs:
- User app: `http://localhost:5173`
- Admin app: `http://localhost:5174`
- API: `http://localhost:5000`

Make sure you create `.env` files from examples in `server/`, `client/`, and `admin/` before running.

## GitHub Hosting (Frontend only)


### Why you are seeing documentation instead of the app

If GitHub Pages is showing a markdown/docs-like page, it means Pages is not serving your built frontend (`client/dist`) yet.
This project root contains `README.md`, so when Pages is pointed to the wrong source, you will see documentation-style content.

Use this repository workflow:
- enable Pages source as **GitHub Actions** in repo settings
- push to `main` so `.github/workflows/deploy-client-pages.yml` builds and deploys `client/dist`
- set repository variables (optional but recommended):
  - `VITE_API_URL`
  - `VITE_SOCKET_URL`

After deploy, your URL will be:
`https://<username>.github.io/<repo-name>/`

> Note: GitHub Pages hosts only the frontend. The Node.js API must run separately (local/EC2/Render/etc.).


GitHub Pages can host only static frontend assets, not the Node.js API.

You can still host `client` or `admin` on GitHub Pages by building with a base path:

```bash
cd client
VITE_BASE_PATH=/your-repo-name/ npm run build
```

Then deploy the `dist/` folder to Pages (or use a Pages workflow).
For full project real-time functionality, keep API on a backend host (local/EC2/Render/etc.) and set:

- `VITE_API_URL=https://your-api-domain`
- `VITE_SOCKET_URL=https://your-api-domain`
