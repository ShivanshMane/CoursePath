import React from 'react';
import { AlertTriangle, AlertCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { ValidationWarning } from '../api/plans';

interface ValidationBannerProps {
  warnings: ValidationWarning[];
  onWarningClick?: (warning: ValidationWarning) => void;
}

const ValidationBanner: React.FC<ValidationBannerProps> = ({ warnings, onWarningClick }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  if (warnings.length === 0) return null;

  const errors = warnings.filter(w => w.severity === 'error');
  const warningsOnly = warnings.filter(w => w.severity === 'warning');

  const getIcon = (severity: 'error' | 'warning') => {
    if (severity === 'error') {
      return <XCircle className="h-5 w-5" />;
    }
    return <AlertTriangle className="h-5 w-5" />;
  };

  const getSeverityColor = (severity: 'error' | 'warning') => {
    if (severity === 'error') {
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-800 dark:text-red-200',
        icon: 'text-red-600 dark:text-red-400',
      };
    }
    return {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-200',
      icon: 'text-yellow-600 dark:text-yellow-400',
    };
  };

  return (
    <div className="slide-up mb-6">
      <div
        className={`rounded-xl border-2 ${
          errors.length > 0
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        } overflow-hidden shadow-lg`}
      >
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div
              className={`${
                errors.length > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-yellow-600 dark:text-yellow-400'
              }`}
            >
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="text-left">
              <h3
                className={`font-bold text-lg ${
                  errors.length > 0
                    ? 'text-red-900 dark:text-red-100'
                    : 'text-yellow-900 dark:text-yellow-100'
                }`}
              >
                {errors.length > 0 ? 'Plan Issues Detected' : 'Plan Warnings'}
              </h3>
              <p
                className={`text-sm ${
                  errors.length > 0
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-yellow-700 dark:text-yellow-300'
                }`}
              >
                {errors.length > 0 && `${errors.length} error${errors.length !== 1 ? 's' : ''}`}
                {errors.length > 0 && warningsOnly.length > 0 && ', '}
                {warningsOnly.length > 0 && `${warningsOnly.length} warning${warningsOnly.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <div
            className={`${
              errors.length > 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-yellow-600 dark:text-yellow-400'
            }`}
          >
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </button>

        {/* Warnings List */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-2">
            {/* Errors First */}
            {errors.map((warning, index) => {
              const colors = getSeverityColor(warning.severity);
              return (
                <div
                  key={`error-${index}`}
                  onClick={() => onWarningClick?.(warning)}
                  className={`p-3 rounded-lg border ${colors.bg} ${colors.border} ${
                    onWarningClick ? 'cursor-pointer hover:shadow-md' : ''
                  } transition-all duration-200`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={colors.icon}>{getIcon(warning.severity)}</div>
                    <div className="flex-1">
                      <p className={`font-medium ${colors.text}`}>{warning.message}</p>
                      {warning.course_code && (
                        <p className={`text-sm mt-1 ${colors.text} opacity-80`}>
                          Course: {warning.course_code}
                          {warning.semester && ` • Semester: ${warning.semester}`}
                        </p>
                      )}
                      {warning.type === 'prerequisite' && warning.details?.missing_prerequisites && (
                        <p className={`text-sm mt-1 ${colors.text} opacity-80`}>
                          Missing: {warning.details.missing_prerequisites.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Warnings */}
            {warningsOnly.map((warning, index) => {
              const colors = getSeverityColor(warning.severity);
              return (
                <div
                  key={`warning-${index}`}
                  onClick={() => onWarningClick?.(warning)}
                  className={`p-3 rounded-lg border ${colors.bg} ${colors.border} ${
                    onWarningClick ? 'cursor-pointer hover:shadow-md' : ''
                  } transition-all duration-200`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={colors.icon}>{getIcon(warning.severity)}</div>
                    <div className="flex-1">
                      <p className={`font-medium ${colors.text}`}>{warning.message}</p>
                      {warning.course_code && (
                        <p className={`text-sm mt-1 ${colors.text} opacity-80`}>
                          Course: {warning.course_code}
                          {warning.semester && ` • Semester: ${warning.semester}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationBanner;

