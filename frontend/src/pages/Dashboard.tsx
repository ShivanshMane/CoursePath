import React, { useState, useEffect } from 'react';
import { coursesApi, Course } from '../api/courses';
import RequirementsBrowser from '../components/RequirementsBrowser';
import CourseDetail from '../components/CourseDetail';
import { BookOpen, Search, Filter, Users } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [isCourseDetailOpen, setIsCourseDetailOpen] = useState(false);
  const [activeView, setActiveView] = useState<'requirements' | 'courses'>('requirements');

  const [departments, setDepartments] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);

  useEffect(() => {
    loadCourses();
    loadDepartmentsAndLevels();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: any = {
        limit: 5000 // Set high limit to get all courses
      };
      if (selectedDepartment) filters.department = selectedDepartment;
      if (selectedLevel) filters.level = selectedLevel;
      if (searchTerm) filters.search = searchTerm;
      
      const response = await coursesApi.getAll(filters);
      setCourses(response.courses);
    } catch (err) {
      console.error('Error loading courses:', err);
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartmentsAndLevels = async () => {
    try {
      const response = await coursesApi.getAll({ limit: 5000 });
      const deptSet = new Set<string>();
      const levelSet = new Set<string>();
      
      response.courses.forEach(course => {
        const dept = course.code.split(' ')[0];
        const level = course.code.split(' ')[1]?.charAt(0) || '';
        deptSet.add(dept);
        if (level) levelSet.add(level);
      });
      
      setDepartments(Array.from(deptSet).sort());
      setLevels(Array.from(levelSet).sort());
    } catch (err) {
      console.error('Error loading departments and levels:', err);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [searchTerm, selectedDepartment, selectedLevel]);

  const getFilteredCourses = () => {
    let filtered = courses;
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(course => 
        course.code.toLowerCase().includes(searchLower) ||
        course.title.toLowerCase().includes(searchLower) ||
        course.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by department
    if (selectedDepartment) {
      filtered = filtered.filter(course => 
        course.code.startsWith(selectedDepartment)
      );
    }
    
    // Filter by level
    if (selectedLevel) {
      filtered = filtered.filter(course => 
        course.code.split(' ')[1]?.startsWith(selectedLevel)
      );
    }
    
    return filtered;
  };

  const handleCourseClick = (courseCode: string) => {
    setSelectedCourse(courseCode);
    setIsCourseDetailOpen(true);
  };

  const renderCourseCard = (course: Course) => (
    <div
      key={course.code}
      onClick={() => handleCourseClick(course.code)}
      className="group relative glass-card p-6 hover-lift cursor-pointer overflow-hidden"
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-300">
              {course.code}
            </h3>
            <p className="text-sm font-semibold text-gray-500 mb-3">Academic Course</p>
            <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2 leading-relaxed">{course.title}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 group-hover:from-blue-200 group-hover:to-purple-200 transition-all duration-300 shadow-md">
            {course.credits} credit{course.credits !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-gray-500">Available</span>
          </div>
        </div>
      </div>
      
      {/* Hover arrow */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
          <div className="w-0 h-0 border-l-4 border-l-white border-y-4 border-y-transparent"></div>
        </div>
      </div>
    </div>
  );

  const renderRequirementsView = () => (
    <RequirementsBrowser />
  );

  const renderCoursesView = () => (
    <div className="space-y-8 slide-up">
      {/* Header */}
      <div className="text-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-2xl"></div>
        <div className="relative glass-card p-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Course Catalog
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">Browse and explore DePauw's course offerings</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-blue-500 group-hover:text-purple-500 transition-colors duration-300" />
            </div>
            <input
              type="text"
              placeholder="Search courses by code, title, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/90 backdrop-blur-sm border-2 border-blue-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-300/50 focus:border-blue-500 transition-all duration-300 placeholder-gray-400 text-gray-700 font-medium shadow-lg hover:shadow-xl"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="gradient-card p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Filter className="h-6 w-6 text-purple-500" />
            <span className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Filters</span>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="flex-1 min-w-48 px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300/50 focus:border-blue-500 transition-all duration-300 text-gray-700 font-medium shadow-md hover:shadow-lg"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="flex-1 min-w-48 px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-300/50 focus:border-purple-500 transition-all duration-300 text-gray-700 font-medium shadow-md hover:shadow-lg"
            >
              <option value="">All Levels</option>
              {levels.map((level) => (
                <option key={level} value={level}>Level {level}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="gradient-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse"></div>
            <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              {loading ? (
                <span className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                  <span>Loading courses...</span>
                </span>
              ) : (
                `${getFilteredCourses().length} courses found`
              )}
            </span>
          </div>
          {error && (
            <button onClick={loadCourses} className="btn-primary text-sm px-4 py-2">
              Retry
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading courses...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full"></div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Oops! Something went wrong</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button onClick={loadCourses} className="btn-primary">
            Try Again
          </button>
        </div>
      )}

      {/* Courses Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {getFilteredCourses().map((course, index) => (
            <div key={course.code} className="slide-in" style={{ animationDelay: `${index * 50}ms` }}>
              {renderCourseCard(course)}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && getFilteredCourses().length === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No courses found</h3>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-6">Try adjusting your search terms or filters.</p>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => setSearchTerm('')}
              className="btn-outline"
            >
              Clear Search
            </button>
            <button 
              onClick={() => {
                setSelectedDepartment('');
                setSelectedLevel('');
              }}
              className="btn-primary"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-xl"></div>
        <div className="relative glass-card p-2">
          <nav className="flex space-x-2">
            <button
              onClick={() => setActiveView('requirements')}
              className={`group relative flex-1 flex items-center justify-center space-x-3 py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 ${
                activeView === 'requirements'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                  : 'text-gray-600 dark:text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-gray-500 hover:to-gray-600 hover:scale-105'
              }`}
            >
              <Users className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
              <span>Requirements Browser</span>
              {activeView === 'requirements' && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-xl blur-sm"></div>
              )}
            </button>
            <button
              onClick={() => setActiveView('courses')}
              className={`group relative flex-1 flex items-center justify-center space-x-3 py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 ${
                activeView === 'courses'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                  : 'text-gray-600 dark:text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-gray-500 hover:to-gray-600 hover:scale-105'
              }`}
            >
              <BookOpen className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
              <span>Course Catalog</span>
              {activeView === 'courses' && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-xl blur-sm"></div>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeView === 'requirements' ? renderRequirementsView() : renderCoursesView()}

      {/* Course Detail Modal */}
      {selectedCourse && (
        <CourseDetail
          courseCode={selectedCourse}
          isOpen={isCourseDetailOpen}
          onClose={() => {
            setSelectedCourse(null);
            setIsCourseDetailOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
