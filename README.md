# CoursePath - DePauw Academic Planning Tool

A web-based application that helps DePauw students plan their academic pathway. Built as a senior project with a focus on user-friendly course planning, prerequisite tracking, and academic requirement management.

## 🎯 Project Overview

CoursePath is designed to streamline the academic planning process for DePauw University students by providing:

- **Secure Authentication**: Firebase-based user authentication system
- **Requirements Browser**: Comprehensive view of majors, minors, and general education requirements
- **Course Catalog**: Detailed course information with prerequisites and scheduling
- **Interactive Planning**: Intuitive interface for exploring academic pathways

## 🏗️ Tech Stack

### Frontend
- **React.js** (v18.2) - Modern UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** (v3.4) - Utility-first styling
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Firebase Authentication** - User authentication

### Backend
- **Node.js** (v20.11.10) - JavaScript runtime
- **Express.js** (v4.19) - Web framework
- **TypeScript** - Type-safe development
- **CORS & Helmet** - Security middleware

### Future Integrations (Checkpoint #2+)
- **PostgreSQL** (v16) - Database
- **Axios + Cheerio** - Web scraping for course data
- **PDF Generation** - Academic plan export

## 🚀 Quick Start

### Prerequisites
- Node.js (v20.11.10 or higher)
- npm or yarn
- Firebase project (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CoursePath
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication with Email/Password
   - Copy your Firebase config to `frontend/.env`:
     ```env
     VITE_FIREBASE_API_KEY=your-api-key
     VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your-project-id
     VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
     VITE_FIREBASE_APP_ID=your-app-id
     ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend API server at `http://localhost:3001`
   - Frontend development server at `http://localhost:5173`

## 📱 Demo Flow

The application provides a complete demo flow for Checkpoint #1:

### 1. Authentication
- **Sign Up**: Create a new account with email/password
- **Sign In**: Login with existing credentials
- **Error Handling**: Clear error messages for invalid login attempts
- **Logout**: Secure session termination

### 2. Requirements Browser
- **Majors**: Browse available major programs with requirements
- **Minors**: Explore minor programs and their course requirements
- **General Education**: View comprehensive gen ed requirements
- **Search & Filter**: Find programs by name, department, or description
- **Detailed Views**: Click programs to see full requirement breakdowns

### 3. Course Catalog
- **Course Search**: Search by code, title, or description
- **Filtering**: Filter by department and course level
- **Course Details**: Click courses to view:
  - Prerequisites and corequisites
  - Typical offering terms
  - General education categories
  - Dependent courses (courses that require this one)

## 🏛️ Project Structure

```
CoursePath/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── data/           # Static JSON datasets
│   │   │   ├── programs.json
│   │   │   └── courses.json
│   │   ├── routes/         # API route handlers
│   │   ├── scraping/       # Future web scraping (placeholder)
│   │   └── server.ts       # Main server file
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # React.js application
│   ├── src/
│   │   ├── api/           # API client and services
│   │   ├── components/    # Reusable UI components
│   │   ├── config/        # Configuration files
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   └── main.tsx       # Application entry point
│   ├── package.json
│   └── vite.config.ts
├── package.json           # Root package.json
└── README.md
```

## 🔧 Development Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development mode
- `npm run install:all` - Install dependencies for all packages
- `npm run build` - Build the frontend for production
- `npm start` - Start production server

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run type-check` - Run TypeScript type checking

### Frontend
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📊 API Endpoints

### Programs
- `GET /api/programs` - Get all programs (majors, minors, gen ed)
- `GET /api/programs/majors` - Get all majors
- `GET /api/programs/minors` - Get all minors
- `GET /api/programs/general-education` - Get gen ed requirements
- `GET /api/programs/:id` - Get specific program by ID

### Courses
- `GET /api/courses` - Get courses with optional filtering
- `GET /api/courses/:code` - Get specific course by code
- `GET /api/courses/department/:department` - Get courses by department
- `GET /api/courses/prerequisites/:code` - Get dependent courses

### Health Check
- `GET /api/health` - Server health status

## 🔐 Authentication

The application uses Firebase Authentication with the following features:

- **Email/Password Authentication**: Secure user registration and login
- **Protected Routes**: Automatic redirection for unauthenticated users
- **Error Handling**: User-friendly error messages for common auth issues
- **Session Management**: Persistent login state across browser sessions

## 🎨 UI/UX Features

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Modern Interface**: Clean, professional design with Tailwind CSS
- **Interactive Elements**: Hover effects, transitions, and loading states
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Error States**: Clear error messages and retry mechanisms

## 📈 Future Roadmap (Checkpoint #2+)

### Database Integration
- PostgreSQL database setup
- User data persistence
- Academic plan storage

### Web Scraping
- Automated course data collection from DePauw catalog
- Real-time requirement updates
- Schedule information integration

### Advanced Features
- **Semester Planning**: Drag-and-drop course scheduling
- **Prerequisite Validation**: Automatic prerequisite checking
- **PDF Export**: Generate printable academic plans
- **Progress Tracking**: Visual progress indicators
- **Course Recommendations**: AI-powered course suggestions

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Authentication Errors**
   - Verify Firebase configuration in `.env` file
   - Check that Email/Password authentication is enabled in Firebase Console
   - Ensure project ID and API key are correct

2. **API Connection Issues**
   - Verify backend server is running on port 3001
   - Check CORS settings in backend configuration
   - Ensure `VITE_API_URL` is set correctly in frontend `.env`

3. **Build Errors**
   - Run `npm run type-check` to identify TypeScript errors
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility

### Development Tips

- Use browser dev tools to inspect API requests
- Check console for authentication state changes
- Use React Developer Tools for component debugging
- Monitor network tab for API response errors

## 🤝 Contributing

This is a senior project repository. For development:

1. Create feature branches for new functionality
2. Follow TypeScript best practices
3. Maintain consistent code formatting
4. Update documentation for new features
5. Test thoroughly before committing

## 📄 License

This project is part of a senior capstone project at DePauw University.

## 📞 Support

For questions or issues related to this project, please contact the development team or refer to the project documentation.

---

**CoursePath** - Helping DePauw students navigate their academic journey, one course at a time. 🎓
