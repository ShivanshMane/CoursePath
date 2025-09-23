import React, { useState, useEffect } from 'react';
import { coursesApi, Course } from '../api/courses';
import { BookOpen, Clock, Users, Calendar, ArrowLeft, ExternalLink } from 'lucide-react';

interface CourseDetailProps {
  courseCode: string;
  isOpen: boolean;
  onClose: () => void;
}

const CourseDetail: React.FC<CourseDetailProps> = ({ courseCode, isOpen, onClose }) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [dependentCourses, setDependentCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && courseCode) {
      loadCourseDetails();
    }
  }, [isOpen, courseCode]);

  const loadCourseDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [courseData, dependentData] = await Promise.all([
        coursesApi.getByCode(courseCode),
        coursesApi.getDependentCourses(courseCode)
      ]);
      
      setCourse(courseData);
      setDependentCourses(dependentData);
    } catch (err) {
      console.error('Error loading course details:', err);
      setError('Failed to load course details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPrerequisitesText = (prerequisites: string[]) => {
    if (prerequisites.length === 0) {
      return 'None';
    }
    return prerequisites.join(', ');
  };

  const getCorequisitesText = (corequisites: string[]) => {
    if (corequisites.length === 0) {
      return 'None';
    }
    return corequisites.join(', ');
  };

  const getTermsText = (terms: string[]) => {
    if (terms.length === 0) {
      return 'Not specified';
    }
    return terms.join(', ');
  };

  const getGenEdCategoriesText = (categories: string[]) => {
    if (categories.length === 0) {
      return 'None';
    }
    return categories.join(', ');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {loading ? 'Loading...' : course?.code || courseCode}
                </h2>
                <p className="text-gray-600">
                  {loading ? 'Please wait...' : course?.title || ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">{error}</div>
              <button onClick={loadCourseDetails} className="btn-primary">
                Try Again
              </button>
            </div>
          )}

          {course && (
            <div className="space-y-6">
              {/* Course Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-lg">
                      <BookOpen className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Credits</p>
                      <p className="text-lg font-semibold text-gray-900">{course.credits}</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Department</p>
                      <p className="text-lg font-semibold text-gray-900">{course.department}</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Level</p>
                      <p className="text-lg font-semibold text-gray-900">{course.level}00</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed">{course.description}</p>
              </div>

              {/* Course Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Prerequisites */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Prerequisites</h3>
                  <p className="text-gray-700">
                    {getPrerequisitesText(course.prerequisites)}
                  </p>
                </div>

                {/* Corequisites */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Corequisites</h3>
                  <p className="text-gray-700">
                    {getCorequisitesText(course.corequisites)}
                  </p>
                </div>

                {/* Typical Terms */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Typical Terms</h3>
                  <p className="text-gray-700">
                    {getTermsText(course.typicalTerms)}
                  </p>
                </div>

                {/* General Education Categories */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Gen Ed Categories</h3>
                  <p className="text-gray-700">
                    {getGenEdCategoriesText(course.genEdCategories)}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Course Status</h3>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    course.offered 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {course.offered ? 'Currently Offered' : 'Not Currently Offered'}
                  </span>
                </div>
              </div>

              {/* Dependent Courses */}
              {dependentCourses.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Courses that require {course.code}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dependentCourses.map((dependentCourse) => (
                      <div
                        key={dependentCourse.code}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => {
                          // Close current modal and open new one
                          onClose();
                          // Note: In a real app, you'd want to handle this navigation properly
                          setTimeout(() => {
                            // This would trigger opening the new course detail
                            console.log('Opening course:', dependentCourse.code);
                          }, 100);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{dependentCourse.code}</p>
                            <p className="text-sm text-gray-600 line-clamp-1">{dependentCourse.title}</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
