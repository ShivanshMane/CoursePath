import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut, User, BookOpen, GraduationCap } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-400 border-2 border-black rounded shadow-md">
                <div className="text-center">
                  <div className="w-6 h-6 mx-auto mb-0.5">
                    <div className="w-full h-full bg-yellow-400 border border-black rounded relative overflow-hidden">
                      <div className="absolute bottom-0 left-0 w-4 h-1.5 bg-black"></div>
                      <div className="absolute bottom-0 right-1 w-3 h-3 bg-black rounded-full"></div>
                      <div className="absolute top-0.5 left-1 w-1.5 h-1 bg-black rounded"></div>
                    </div>
                  </div>
                  <div className="text-[6px] font-bold text-black leading-tight">
                    <div>DEPAUW</div>
                    <div>UNIVERSITY</div>
                  </div>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CoursePath</h1>
                <p className="text-sm text-gray-500">DePauw Academic Planning</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
            <p>CoursePath - DePauw University Academic Planning Tool</p>
            <p className="mt-1">Built for Senior Project - Checkpoint #1</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
