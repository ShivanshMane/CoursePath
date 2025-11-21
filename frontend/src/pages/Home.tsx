import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Calendar, 
  Search, 
  Database, 
  Settings, 
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-yellow-600/10 to-yellow-700/10 rounded-3xl blur-2xl"></div>
        <div className="relative glass-card p-12">
          <h1 className="text-5xl font-bold text-black dark:text-white mb-6">
            Welcome to CoursePath
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            CoursePath is a web-based academic planning platform designed exclusively for DePauw University students. 
            It helps you explore majors, minors, and general education requirements, and build your personalized 
            semester-by-semester plan — all in one place.
          </p>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-10 max-w-4xl mx-auto leading-relaxed">
            With CoursePath, you can easily search courses, manage your academic roadmap, and stay on track for graduation. 
            The system ensures your plan meets every requirement while allowing flexibility for study abroad, double majors, 
            and early graduation goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/requirements"
              className="group relative flex items-center justify-center space-x-3 px-8 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <BookOpen className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
              <span>Explore Requirements</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link
              to="/planning"
              className="group relative flex items-center justify-center space-x-3 px-8 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-yellow-500 hover:to-yellow-600 text-gray-700 dark:text-gray-300 hover:text-black shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Calendar className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
              <span>Start Planning</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-yellow-600/5 to-yellow-700/5 rounded-3xl blur-2xl"></div>
        <div className="relative glass-card p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-black dark:text-white mb-4">
              ✨ Key Features
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Everything you need to plan your academic journey at DePauw University
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative glass-card p-6 hover-lift cursor-pointer">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl shadow-lg">
                  <BookOpen className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-black dark:text-white">
                  🧭 Explore Requirements
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Explore all majors, minors, and general education requirements in one place
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group relative glass-card p-6 hover-lift cursor-pointer">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl shadow-lg">
                  <Search className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-black dark:text-white">
                  📚 Course Catalog
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Browse the complete course catalog with details and prerequisites
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative glass-card p-6 hover-lift cursor-pointer">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl shadow-lg">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-black dark:text-white">
                  🗓️ Academic Planning
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Create and customize your academic plan by semester
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group relative glass-card p-6 hover-lift cursor-pointer">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl shadow-lg">
                  <Database className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-black dark:text-white">
                  💾 Secure Storage
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Save your progress with secure PostgreSQL database integration
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group relative glass-card p-6 hover-lift cursor-pointer">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl shadow-lg">
                  <Settings className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-black dark:text-white">
                  ⚙️ Custom Preferences
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Set preferences like study abroad or early graduation
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group relative glass-card p-6 hover-lift cursor-pointer">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl shadow-lg">
                  <CheckCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-black dark:text-white">
                  🎯 Track Progress
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Stay on track for graduation with requirement tracking
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-yellow-600/10 to-yellow-700/10 rounded-3xl blur-2xl"></div>
        <div className="relative glass-card p-12">
          <h2 className="text-3xl font-bold text-black dark:text-white mb-6">
            Ready to Plan Your Academic Journey?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Start exploring DePauw's academic programs and create your personalized semester plan today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/requirements"
              className="group relative flex items-center justify-center space-x-3 px-8 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <BookOpen className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
              <span>Get Started</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
