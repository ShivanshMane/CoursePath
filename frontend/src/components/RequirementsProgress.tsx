import React from 'react';
import { CheckCircle, Circle, Clock, BookOpen } from 'lucide-react';
import { RequirementsProgress as RequirementsProgressType } from '../api/plans';

interface RequirementsProgressProps {
  progress: RequirementsProgressType;
  onCourseClick?: (courseCode: string) => void;
}

const RequirementsProgress: React.FC<RequirementsProgressProps> = ({ progress, onCourseClick }) => {
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  return (
    <div className="glass-card p-6 space-y-6">
      {/* Overall Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-black dark:text-white">Requirements Progress</h3>
          <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {progress.percentage_complete}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 transition-all duration-500 ease-out"
            style={{ width: `${progress.percentage_complete}%` }}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {progress.completed_requirements}
            </div>
            <div className="text-xs text-green-700 dark:text-green-300 mt-1">Completed</div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {progress.in_progress_requirements}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">In Progress</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {progress.remaining_requirements}
            </div>
            <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">Remaining</div>
          </div>
        </div>
      </div>

      {/* Requirement Groups */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          Requirement Details
        </h4>
        {progress.details.map((detail, index) => {
          const isExpanded = expandedGroups.has(detail.group_name);
          const totalCourses = detail.required_courses.length;
          const completedCount = detail.completed.length;
          const plannedCount = detail.planned.length;

          return (
            <div
              key={index}
              className={`border-2 rounded-lg overflow-hidden transition-all duration-200 ${
                detail.is_complete
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                  : plannedCount > 0
                  ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(detail.group_name)}
                className="w-full p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`${
                      detail.is_complete
                        ? 'text-green-600 dark:text-green-400'
                        : plannedCount > 0
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {detail.is_complete ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : plannedCount > 0 ? (
                      <Clock className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>
                  <div className="text-left">
                    <h5 className="font-semibold text-gray-900 dark:text-white">{detail.group_name}</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {completedCount + plannedCount} of {totalCourses} courses{' '}
                      {detail.type === 'choice' && '(choose any)'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`text-sm font-semibold px-3 py-1 rounded-full ${
                      detail.is_complete
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                        : plannedCount > 0
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {Math.round(((completedCount + plannedCount) / totalCourses) * 100)}%
                  </div>
                  <BookOpen
                    className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {/* Course List */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {/* Completed Courses */}
                  {detail.completed.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-2 uppercase tracking-wide">
                        Completed
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {detail.completed.map((courseCode) => (
                          <button
                            key={courseCode}
                            onClick={() => onCourseClick?.(courseCode)}
                            className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
                          >
                            {courseCode}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Planned Courses */}
                  {detail.planned.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2 uppercase tracking-wide">
                        Planned
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {detail.planned.map((courseCode) => (
                          <button
                            key={courseCode}
                            onClick={() => onCourseClick?.(courseCode)}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                          >
                            {courseCode}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Remaining Courses */}
                  {detail.remaining.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                        Remaining
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {detail.remaining.map((courseCode) => (
                          <button
                            key={courseCode}
                            onClick={() => onCourseClick?.(courseCode)}
                            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            {courseCode}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RequirementsProgress;

