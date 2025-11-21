import React, { useState, useEffect } from 'react';
import { X, GraduationCap, MapPin, Clock, BookOpen } from 'lucide-react';
import { UserPreferences } from '../api/plans';

interface UserPreferencesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSave: (preferences: UserPreferences) => void;
}

const UserPreferencesPanel: React.FC<UserPreferencesPanelProps> = ({
  isOpen,
  onClose,
  preferences,
  onSave
}) => {
  const [formData, setFormData] = useState<UserPreferences>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(preferences);
    }
  }, [isOpen, preferences]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (updates: Partial<UserPreferences>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const updateEarlyGraduation = (updates: Partial<UserPreferences['early_graduation']>) => {
    setFormData(prev => ({
      ...prev,
      early_graduation: { ...prev.early_graduation, ...updates }
    }));
  };

  const updatePriorCredits = (updates: Partial<UserPreferences['prior_credits']>) => {
    setFormData(prev => ({
      ...prev,
      prior_credits: { ...prev.prior_credits, ...updates }
    }));
  };

  const updateStudyAbroad = (updates: Partial<UserPreferences['study_abroad']>) => {
    setFormData(prev => ({
      ...prev,
      study_abroad: { ...prev.study_abroad, ...updates }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative glass-card max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-yellow-600/5 to-yellow-700/5 rounded-2xl"></div>
        
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-8 border-b border-white/20">
          <div>
            <h2 className="text-3xl font-bold text-black dark:text-white mb-2">
              Academic Preferences
            </h2>
            <p className="text-gray-600 dark:text-gray-300">Customize your academic planning experience</p>
          </div>
          <button
            onClick={onClose}
            className="group p-3 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all duration-300 hover:scale-110"
          >
            <X className="h-6 w-6 text-gray-500 dark:text-gray-400 group-hover:text-red-600 transition-colors duration-300" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="relative z-10 p-8 space-y-8">
          {/* Early Graduation */}
          <div className="gradient-card p-6 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl shadow-lg">
                <GraduationCap className="h-5 w-5 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white">
                Early Graduation
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Term
                </label>
                <select
                  value={formData.early_graduation?.target_term || ''}
                  onChange={(e) => updateEarlyGraduation({ target_term: e.target.value || undefined })}
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300/50 focus:border-blue-500 transition-all duration-300 text-gray-700 font-medium shadow-md hover:shadow-lg"
                >
                  <option value="">Select term</option>
                  <option value="Fall">Fall</option>
                  <option value="Spring">Spring</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Year
                </label>
                <input
                  type="number"
                  min={new Date().getFullYear()}
                  max={new Date().getFullYear() + 10}
                  value={formData.early_graduation?.target_year || ''}
                  onChange={(e) => updateEarlyGraduation({ target_year: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., 2026"
                />
              </div>
            </div>
          </div>

          {/* Prior Credits */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Prior Credits
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AP Credits
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={formData.prior_credits?.ap_credits || ''}
                  onChange={(e) => updatePriorCredits({ ap_credits: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transfer Credits
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={formData.prior_credits?.transfer_credits || ''}
                  onChange={(e) => updatePriorCredits({ transfer_credits: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Study Abroad */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Study Abroad
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Term
                </label>
                <select
                  value={formData.study_abroad?.term || ''}
                  onChange={(e) => updateStudyAbroad({ term: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select term</option>
                  <option value="Fall">Fall</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Year
                </label>
                <input
                  type="number"
                  min={new Date().getFullYear()}
                  max={new Date().getFullYear() + 10}
                  value={formData.study_abroad?.year || ''}
                  onChange={(e) => updateStudyAbroad({ year: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., 2025"
                />
              </div>
            </div>
          </div>

          {/* Academic Plans */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Academic Plans
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="double_major"
                  checked={formData.double_major || false}
                  onChange={(e) => updateFormData({ double_major: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <label htmlFor="double_major" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Planning to pursue a double major
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minor
                </label>
                <input
                  type="text"
                  value={formData.minor || ''}
                  onChange={(e) => updateFormData({ minor: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Computer Science"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserPreferencesPanel;
