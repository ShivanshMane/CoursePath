import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, User, Sun, Moon, Settings, Calendar, BookOpen, Home } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-lg border-b border-white/20 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4 group">
              <div className="relative">
                <img
                  src="/images/depauw-logo.png"
                  alt="DePauw University"
                  className="w-14 h-14 object-contain group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    if (img.src.indexOf('/depauw-logo.png') === -1) {
                      img.src = '/depauw-logo.png';
                    }
                  }}
                />
                <div className="absolute -inset-2 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-full opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 via-yellow-700 to-yellow-800 bg-clip-text text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400">
                  CoursePath
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">DePauw Academic Planning</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              <Link
                to="/"
                className="group relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-black transition-all duration-300 hover:bg-gradient-to-r hover:from-yellow-500 hover:to-yellow-600 hover:shadow-lg hover:scale-105"
              >
                <Home className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                <span>Home</span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></div>
              </Link>
              <Link
                to="/requirements"
                className="group relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-black transition-all duration-300 hover:bg-gradient-to-r hover:from-yellow-500 hover:to-yellow-600 hover:shadow-lg hover:scale-105"
              >
                <BookOpen className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                <span>Requirements</span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></div>
              </Link>
              <Link
                to="/planning"
                className="group relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-black transition-all duration-300 hover:bg-gradient-to-r hover:from-yellow-600 hover:to-yellow-700 hover:shadow-lg hover:scale-105"
              >
                <Calendar className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                <span>Planning</span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 to-yellow-700/20 rounded-xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></div>
              </Link>
            </nav>

            {/* Theme Toggle and User Menu */}
            <div className="flex items-center space-x-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="group relative p-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-yellow-400 hover:to-orange-400 dark:hover:from-yellow-500 dark:hover:to-orange-500 transition-all duration-300 hover:scale-110 hover:shadow-lg"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500 group-hover:text-white transition-colors duration-300" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></div>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border border-yellow-200/50 dark:border-yellow-700/50">
                  <User className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{user?.displayName || user?.email}</span>
                </div>
                
                <button
                  onClick={() => navigate('/profile')}
                  className="group relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-white transition-all duration-300 hover:bg-gradient-to-r hover:from-yellow-500 hover:to-yellow-600 hover:shadow-lg hover:scale-105"
                >
                  <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                  <span>Profile</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></div>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="group relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-white transition-all duration-300 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 hover:shadow-lg hover:scale-105"
                >
                  <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  <span>Logout</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div className="relative z-10">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative mt-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-t border-white/20 dark:border-gray-700/50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-sm font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              CoursePath - DePauw University Academic Planning Tool
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Built for Senior Project - Checkpoint #1
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
