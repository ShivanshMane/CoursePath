import React, { useState, useEffect } from 'react';
import { coursesApi, Course } from '../api/courses';
import RequirementsBrowser from '../components/RequirementsBrowser';
import CourseDetail from '../components/CourseDetail';
import { BookOpen, Search, Filter, Calendar, Users } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'requirements' | 'courses'>('requirements');

  const departments = ['Computer Science', 'Mathematics', 'Economics', 'Biology', 'English'];
  const levels = ['100', '200', '300'];

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: any = {};
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

  useEffect(() => {
    loadCourses();
  }, [searchTerm, selectedDepartment, selectedLevel]);

  const getFilteredCourses = () => {
    if (!searchTerm && !selectedDepartment && !selectedLevel) {
      return courses;
    }
    return courses;
  };

  const handleCourseClick = (courseCode: string) => {
    setSelectedCourse(courseCode);
  };

  const renderCourseCard = (course: Course) => (
    <div
      key={course.code}
      onClick={() => handleCourseClick(course.code)}
      className="card-hover group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
            {course.code}
          </h3>
          <p className="text-sm text-gray-600 mb-2">{course.department}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            {course.credits} credit{course.credits !== 1 ? 's' : ''}
          </span>
          {course.offered && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Offered
            </span>
          )}
        </div>
      </div>
      
      <h4 className="font-medium text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
        {course.title}
      </h4>
      
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {course.description}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Level {course.level}00</span>
        <span>{course.typicalTerms.join(', ')}</span>
      </div>
      
      {course.prerequisites.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Prerequisites:</p>
          <div className="flex flex-wrap gap-1">
            {course.prerequisites.slice(0, 3).map((prereq, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
              >
                {prereq}
              </span>
            ))}
            {course.prerequisites.length > 3 && (
              <span className="text-xs text-gray-500">+{course.prerequisites.length - 3} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderRequirementsView = () => (
    <RequirementsBrowser />
  );

  const renderCoursesView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Catalog</h1>
        <p className="text-gray-600">Browse and explore DePauw's course offerings</p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search courses by code, title, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Levels</option>
            {levels.map((level) => (
              <option key={level} value={level}>Level {level}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {loading ? 'Loading...' : `${getFilteredCourses().length} courses found`}
        </span>
        {error && (
          <button onClick={loadCourses} className="text-primary-600 hover:text-primary-700">
            Retry
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <button onClick={loadCourses} className="btn-primary">
            Try Again
          </button>
        </div>
      )}

      {/* Courses Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getFilteredCourses().map(renderCourseCard)}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && getFilteredCourses().length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-500">Try adjusting your search terms or filters.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveView('requirements')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeView === 'requirements'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Requirements Browser</span>
            </div>
          </button>
          <button
            onClick={() => setActiveView('courses')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeView === 'courses'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Course Catalog</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeView === 'requirements' ? renderRequirementsView() : renderCoursesView()}

      {/* Course Detail Modal */}
      {selectedCourse && (
        <CourseDetail
          courseCode={selectedCourse}
          isOpen={!!selectedCourse}
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
