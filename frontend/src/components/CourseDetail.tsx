import React, { useState, useEffect } from 'react';
import { coursesApi, Course } from '../api/courses';
import { BookOpen, Users, Calendar, ArrowLeft, ExternalLink } from 'lucide-react';

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
      
      // Try to get course details
      let courseData: Course;
      let dependentData: Course[] = [];
      
      try {
        courseData = await coursesApi.getByCode(courseCode);
      } catch (courseErr) {
        console.error('Error loading course:', courseErr);
        // If individual course fails, try to get it from the full list
        try {
          const allCourses = await coursesApi.getAll({ limit: 5000 });
          const foundCourse = allCourses.courses.find(c => c.code === courseCode);
          if (foundCourse) {
            courseData = foundCourse;
          } else {
            throw new Error('Course not found');
          }
        } catch (fallbackErr) {
          console.error('Error in fallback:', fallbackErr);
          throw new Error('Course not found');
        }
      }
      
      // Try to get dependent courses (optional)
      try {
        dependentData = await coursesApi.getDependentCourses(courseCode);
      } catch (depErr) {
        console.warn('Could not load dependent courses:', depErr);
        // Don't fail the whole request if dependent courses fail
        dependentData = [];
      }
      
      setCourse(courseData);
      setDependentCourses(dependentData);
    } catch (err) {
      console.error('Error loading course details:', err);
      setError('Failed to load course details. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? 'Loading...' : course?.code || courseCode}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {loading ? 'Please wait...' : course?.title || ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
                      <p className="text-lg font-semibold text-gray-900">{course.credits || 1}</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Terms Offered</p>
                      <p className="text-lg font-semibold text-gray-900">{course.termOffered || 'Fall, Spring'}</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Prerequisites</p>
                      <p className="text-lg font-semibold text-gray-900">{course.prerequisites?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed">
                  {course.description || 'No description available for this course.'}
                </p>
              </div>

              {/* Prerequisites */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Prerequisites</h3>
                {course.prerequisites && course.prerequisites.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {course.prerequisites.map((prereq, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {prereq}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No prerequisites required</p>
                )}
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
