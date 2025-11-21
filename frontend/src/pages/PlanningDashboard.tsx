import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { plansApi, SemesterPlan, UserPreferences, ValidationResult } from '../api/plans';
import { coursesApi, Course } from '../api/courses';
import { programsApi } from '../api/programs';
import CourseDetail from '../components/CourseDetail';
import UserPreferencesPanel from '../components/UserPreferencesPanel';
import ValidationBanner from '../components/ValidationBanner';
import RequirementsProgress from '../components/RequirementsProgress';
import { exportPlanToPDF } from '../utils/pdfExport';
import { 
  Calendar, 
  Plus, 
  Edit3, 
  Trash2, 
  BookOpen, 
  Settings,
  GraduationCap,
  MapPin,
  Clock,
  Download,
  Sparkles,
  RefreshCw,
  GripVertical
} from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const PlanningDashboard: React.FC = () => {
  const { user } = useAuth();
  const [semesterPlans, setSemesterPlans] = useState<SemesterPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [isCourseDetailOpen, setIsCourseDetailOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [availablePrograms, setAvailablePrograms] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  );

  // Load user's plan data
  useEffect(() => {
    if (user?.uid) {
      loadUserPlan();
      loadPrograms();
    }
  }, [user?.uid]);

  // Validate plan when it changes
  useEffect(() => {
    if (user?.uid && semesterPlans.length > 0 && selectedProgram) {
      validatePlan();
    }
  }, [semesterPlans, selectedProgram]);

  const loadUserPlan = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const semesterPlan = await plansApi.getSemesterPlan(user!.uid);
      setSemesterPlans(semesterPlan);
      
      // Load preferences from the plan
      const plan = await plansApi.getPlan(user!.uid);
      if (plan) {
        setPreferences(plan.preferences);
      }
    } catch (err) {
      console.error('Error loading user plan:', err);
      setError('Failed to load your academic plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadPrograms = async () => {
    try {
      const programs = await programsApi.getAll();
      setAvailablePrograms(programs);
    } catch (err) {
      console.error('Error loading programs:', err);
      setError('Failed to load programs. Please refresh the page.');
    }
  };

  const validatePlan = async () => {
    if (!user?.uid) return;
    
    try {
      const result = await plansApi.validatePlan(user.uid, selectedProgram || undefined);
      setValidation(result);
    } catch (err) {
      console.error('Error validating plan:', err);
    }
  };

  const handleGeneratePlan = async () => {
    if (!user?.uid || !selectedProgram) {
      setError('Please select a program first');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      
      const generatedPlan = await plansApi.generatePlan(
        user.uid,
        selectedProgram,
        preferences
      );

      console.log(`📋 Generated plan with ${generatedPlan.length} courses`);

      // Add generated courses to plan
      let successCount = 0;
      let errorCount = 0;
      
      for (const item of generatedPlan) {
        if (!item.is_locked) {
          try {
            await plansApi.addCourseToPlan(user.uid, {
              course_code: item.course_code,
              semester: item.semester,
            });
            successCount++;
            console.log(`✅ Added ${item.course_code} to ${item.semester}`);
          } catch (err) {
            errorCount++;
            console.error(`❌ Failed to add ${item.course_code}:`, err);
            // Continue adding other courses even if one fails
          }
        }
      }

      console.log(`📊 Plan generation complete: ${successCount} added, ${errorCount} failed`);

      // Reload plan
      await loadUserPlan();
    } catch (err) {
      console.error('Error generating plan:', err);
      setError('Failed to generate plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = () => {
    if (!user) return;

    exportPlanToPDF({
      studentName: user.displayName || user.email || 'Student',
      planTitle: selectedProgram 
        ? availablePrograms.find(p => p.id === selectedProgram)?.name || 'Academic Plan'
        : 'Academic Plan',
      catalogYear: new Date().getFullYear(),
      semesterPlans,
      warnings: validation?.warnings,
      requirementsProgress: validation?.requirements_progress,
    });
  };

  const handleAddCourse = async (courseCode: string, semester: string) => {
    try {
      await plansApi.addCourseToPlan(user!.uid, {
        course_code: courseCode,
        semester,
      });
      await loadUserPlan(); // Reload the plan
    } catch (err) {
      console.error('Error adding course to plan:', err);
      setError('Failed to add course to plan. Please try again.');
    }
  };

  const handleRemoveCourse = async (itemId: string) => {
    try {
      await plansApi.removeCourseFromPlan(user!.uid, itemId);
      await loadUserPlan(); // Reload the plan
    } catch (err) {
      console.error('Error removing course from plan:', err);
      setError('Failed to remove course from plan. Please try again.');
    }
  };

  const handleUpdateCourseNotes = async (itemId: string, notes: string) => {
    try {
      await plansApi.updatePlanItem(user!.uid, itemId, { notes });
      await loadUserPlan(); // Reload the plan
    } catch (err) {
      console.error('Error updating course notes:', err);
      setError('Failed to update course notes. Please try again.');
    }
  };

  const handleUpdatePreferences = async (newPreferences: UserPreferences) => {
    try {
      await plansApi.updatePlan(user!.uid, { preferences: newPreferences });
      setPreferences(newPreferences);
      await loadUserPlan(); // Reload the plan to reflect changes
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError('Failed to update preferences. Please try again.');
    }
  };

  const handleCourseClick = (courseCode: string) => {
    setSelectedCourse(courseCode);
    setIsCourseDetailOpen(true);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveDragId(null);

    if (!over || !user?.uid) return;

    const draggedItemId = active.id as string;
    const targetSemester = over.id as string;

    // Find the dragged item
    let draggedItem: any = null;
    let sourceSemester: string | null = null;

    for (const semesterPlan of semesterPlans) {
      const item = semesterPlan.items.find(i => i.plan_item_id === draggedItemId);
      if (item) {
        draggedItem = item;
        sourceSemester = semesterPlan.semester;
        break;
      }
    }

    if (!draggedItem || !sourceSemester) return;

    // If dropped on the same semester, no action needed for moving between semesters
    // (reordering within semester is handled separately)
    if (sourceSemester === targetSemester) return;

    try {
      // Update the semester for the course
      await plansApi.updatePlanItem(user.uid, draggedItemId, {
        semester: targetSemester,
      });

      // Reload the plan to reflect changes
      await loadUserPlan();
    } catch (err) {
      console.error('Error moving course:', err);
      setError('Failed to move course. Please try again.');
    }
  };

  const generateSemesters = () => {
    const semesters = [];
    const currentYear = new Date().getFullYear();
    
    for (let year = currentYear; year < currentYear + 4; year++) {
      semesters.push(`${year} Fall`, `${year + 1} Spring`);
    }
    
    return semesters;
  };

  const renderSemesterCard = (semester: string, existingPlan?: SemesterPlan) => {
    const isStudyAbroad = preferences.study_abroad && 
      `${preferences.study_abroad.year} ${preferences.study_abroad.term}` === semester;
    
    const isEarlyGraduation = preferences.early_graduation && 
      semester.includes(preferences.early_graduation.target_year?.toString() || '');

    return (
      <div 
        key={semester}
        className={`group relative glass-card p-6 min-h-[280px] hover-lift cursor-pointer overflow-visible ${
          isStudyAbroad 
            ? 'border-orange-200/50' 
            : isEarlyGraduation
            ? 'border-yellow-200/50'
            : 'border-white/30'
        }`}
      >
        {/* Background gradient effect */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
          isStudyAbroad 
            ? 'bg-gradient-to-br from-orange-500/5 via-yellow-500/5 to-red-500/5' 
            : isEarlyGraduation
            ? 'bg-gradient-to-br from-yellow-500/5 via-yellow-600/5 to-yellow-700/5'
            : 'bg-gradient-to-br from-yellow-500/5 via-yellow-600/5 to-yellow-700/5'
        }`}></div>
        
        {/* Glow effect */}
        <div className={`absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
          isStudyAbroad 
            ? 'bg-gradient-to-r from-orange-500/10 to-yellow-500/10' 
            : isEarlyGraduation
            ? 'bg-gradient-to-r from-yellow-500/10 to-yellow-600/10'
            : 'bg-gradient-to-r from-yellow-500/10 to-yellow-600/10'
        }`}></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl group-hover:from-yellow-200 group-hover:to-yellow-300 transition-all duration-300 shadow-lg">
                <Calendar className="h-5 w-5 text-yellow-600 group-hover:text-yellow-700 transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-all duration-300">
                {semester}
              </h3>
            </div>
            
            {isStudyAbroad && (
              <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 group-hover:from-orange-200 group-hover:to-yellow-200 transition-all duration-300 shadow-md">
                <MapPin className="h-4 w-4 mr-2" />
                Study Abroad
              </span>
            )}
            
            {isEarlyGraduation && (
              <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 group-hover:from-yellow-200 group-hover:to-yellow-300 transition-all duration-300 shadow-md">
                <GraduationCap className="h-4 w-4 mr-2" />
                Early Grad
              </span>
            )}
          </div>

          {existingPlan && (
            <div className="mb-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl border border-yellow-200/50 dark:border-yellow-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{existingPlan.items.length} courses</span>
                </div>
                <span className="text-sm font-bold text-black dark:text-white">{existingPlan.total_credits} credits</span>
              </div>
            </div>
          )}

          <SortableContext
            items={existingPlan?.items.map(item => item.plan_item_id) || []}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {existingPlan?.items.map((item) => {
                // Find warnings for this course
                const courseWarnings = validation?.warnings.filter(
                  w => w.course_code === item.course_code && w.semester === semester
                ) || [];
                const hasError = courseWarnings.some(w => w.severity === 'error');
                const hasWarning = courseWarnings.some(w => w.severity === 'warning');
                
                return (
                  <DraggableCourse
                    key={item.plan_item_id}
                    item={item}
                    courseWarnings={courseWarnings}
                    hasError={hasError}
                    hasWarning={hasWarning}
                    onCourseClick={handleCourseClick}
                    onUpdateNotes={handleUpdateCourseNotes}
                    onRemove={handleRemoveCourse}
                  />
                );
              })}
            </div>
          </SortableContext>

          <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-600/50 relative overflow-visible">
            <CourseSelector 
              semester={semester}
              onAddCourse={handleAddCourse}
              disabled={isStudyAbroad}
            />
          </div>
        </div>
        
        {/* Hover arrow */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
          <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center">
            <div className="w-0 h-0 border-l-4 border-l-white border-y-4 border-y-transparent"></div>
          </div>
        </div>
      </div>
    );
  };

  const renderPreferencesSummary = () => {
    const hasPreferences = Object.keys(preferences).length > 0;
    
    if (!hasPreferences) return null;

    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Your Preferences</h3>
          </div>
          <button
            onClick={() => setShowPreferences(true)}
            className="text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300"
          >
            Edit
          </button>
        </div>
        
        <div className="mt-2 space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
          {preferences.early_graduation && (
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-4 w-4" />
              <span>Early graduation target: {preferences.early_graduation.target_year}</span>
            </div>
          )}
          {preferences.study_abroad && (
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Study abroad: {preferences.study_abroad.term} {preferences.study_abroad.year}</span>
            </div>
          )}
          {(preferences.prior_credits?.ap_credits || preferences.prior_credits?.transfer_credits) && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>
                Prior credits: {preferences.prior_credits.ap_credits || 0} AP, {preferences.prior_credits.transfer_credits || 0} transfer
              </span>
            </div>
          )}
          {preferences.double_major && (
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Double major planned</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-yellow-200 rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 font-medium">Loading your academic plan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 slide-up overflow-visible">
      {/* Header */}
      <div className="text-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-yellow-600/10 to-yellow-700/10 rounded-3xl blur-2xl"></div>
        <div className="relative glass-card p-8">
          <h1 className="text-4xl font-bold text-black dark:text-white mb-4">
            Academic Planning Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">Plan your courses semester by semester</p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full"></div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Oops! Something went wrong</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button onClick={loadUserPlan} className="btn-primary">
            Try Again
          </button>
        </div>
      )}

      {/* Program Selector */}
      <div className="gradient-card p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Select Your Program
            </label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
            >
              <option value="">Choose a major or minor...</option>
              {availablePrograms.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name} ({program.type})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleGeneratePlan}
              disabled={!selectedProgram || isGenerating}
              className="group relative flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              {isGenerating ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
              <span>{isGenerating ? 'Generating...' : 'Auto-Generate Plan'}</span>
            </button>
            
            <button
              onClick={handleExportPDF}
              disabled={semesterPlans.length === 0}
              className="group relative flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <Download className="h-5 w-5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Validation Banner */}
      {validation && validation.warnings.length > 0 && (
        <ValidationBanner
          warnings={validation.warnings}
          onWarningClick={(warning) => {
            if (warning.course_code) {
              handleCourseClick(warning.course_code);
            }
          }}
        />
      )}

      {/* Requirements Progress */}
      {validation?.requirements_progress && (
        <RequirementsProgress
          progress={validation.requirements_progress}
          onCourseClick={handleCourseClick}
        />
      )}

      {/* Preferences Summary */}
      {renderPreferencesSummary()}

      {/* Action Buttons */}
      <div className="gradient-card p-6">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowPreferences(true)}
            className="group relative flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-gray-100 to-gray-200 hover:from-yellow-500 hover:to-yellow-600 text-gray-700 hover:text-black transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <Settings className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            <span>Preferences</span>
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 rounded-xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></div>
          </button>
          
          <div className="flex items-center space-x-3 px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border border-yellow-200/50 dark:border-yellow-700/50">
            <div className="w-3 h-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full animate-pulse"></div>
            <span className="text-lg font-bold text-black dark:text-white">
              Total Credits: {semesterPlans.reduce((sum, sem) => sum + sem.total_credits, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Semester Grid with Drag and Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={generateSemesters()}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-visible">
            {generateSemesters().map((semester, index) => {
              const existingPlan = semesterPlans.find(plan => plan.semester === semester);
              return (
                <DroppableSemester key={semester} semester={semester}>
                  <div className="slide-in" style={{ animationDelay: `${index * 50}ms` }}>
                    {renderSemesterCard(semester, existingPlan)}
                  </div>
                </DroppableSemester>
              );
            })}
          </div>
        </SortableContext>

        {/* Drag Overlay - shows the dragged item */}
        <DragOverlay>
          {activeDragId ? (
            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-2xl border-2 border-yellow-400 opacity-90">
              <div className="flex items-center space-x-2">
                <GripVertical className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-semibold text-black dark:text-white">
                  {(() => {
                    for (const semesterPlan of semesterPlans) {
                      const item = semesterPlan.items.find(i => i.plan_item_id === activeDragId);
                      if (item) return item.course_code;
                    }
                    return 'Course';
                  })()}
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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

      {/* Preferences Modal */}
      {showPreferences && (
        <UserPreferencesPanel
          isOpen={showPreferences}
          onClose={() => setShowPreferences(false)}
          preferences={preferences}
          onSave={handleUpdatePreferences}
        />
      )}
    </div>
  );
};

// Droppable Semester Component
interface DroppableSemesterProps {
  semester: string;
  children: React.ReactNode;
}

const DroppableSemester: React.FC<DroppableSemesterProps> = ({ semester, children }) => {
  const { setNodeRef, isOver } = useSortable({
    id: semester,
    data: {
      type: 'semester',
      semester,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`transition-all duration-300 ${
        isOver ? 'ring-4 ring-yellow-400 ring-opacity-50 scale-[1.02]' : ''
      }`}
    >
      {children}
    </div>
  );
};

// Draggable Course Component
interface DraggableCourseProps {
  item: any;
  courseWarnings: any[];
  hasError: boolean;
  hasWarning: boolean;
  onCourseClick: (courseCode: string) => void;
  onUpdateNotes: (itemId: string, notes: string) => void;
  onRemove: (itemId: string) => void;
}

const DraggableCourse: React.FC<DraggableCourseProps> = ({
  item,
  courseWarnings,
  hasError,
  hasWarning,
  onCourseClick,
  onUpdateNotes,
  onRemove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCurrentlyDragging,
  } = useSortable({ id: item.plan_item_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isCurrentlyDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/course flex items-center justify-between p-3 rounded-xl border transition-all duration-300 hover:shadow-md ${
        hasError
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          : hasWarning
          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          : 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border-gray-200/50 dark:border-gray-600/50'
      } ${isCurrentlyDragging ? 'cursor-grabbing z-50' : 'cursor-grab'}`}
    >
      <div className="flex items-center space-x-2 flex-1">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
          title="Drag to move"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <div className="flex-1">
          <div className="flex items-center space-x-2">
            {hasError && (
              <span className="text-red-600 dark:text-red-400" title="Error">
                ⚠️
              </span>
            )}
            {!hasError && hasWarning && (
              <span className="text-yellow-600 dark:text-yellow-400" title="Warning">
                ⚡
              </span>
            )}
            <button
              onClick={() => onCourseClick(item.course_code)}
              className="text-sm font-semibold text-black dark:text-white hover:text-yellow-600 dark:hover:text-yellow-400 transition-all duration-300"
            >
              {item.course_code}
            </button>
          </div>
          {item.notes && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.notes}</p>
          )}
          {courseWarnings.length > 0 && (
            <div className="mt-1 space-y-1">
              {courseWarnings.map((warning, idx) => (
                <p
                  key={idx}
                  className={`text-xs ${
                    warning.severity === 'error'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`}
                >
                  {warning.message}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 opacity-0 group-hover/course:opacity-100 transition-all duration-300">
        <button
          onClick={() => {
            const newNotes = prompt('Edit notes:', item.notes || '');
            if (newNotes !== null) {
              onUpdateNotes(item.plan_item_id, newNotes);
            }
          }}
          className="p-2 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg transition-all duration-300"
          title="Edit notes"
        >
          <Edit3 className="h-4 w-4" />
        </button>
        <button
          onClick={() => onRemove(item.plan_item_id)}
          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all duration-300"
          title="Remove course"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Course Selector Component
interface CourseSelectorProps {
  semester: string;
  onAddCourse: (courseCode: string, semester: string) => void;
  disabled?: boolean;
}

const CourseSelector: React.FC<CourseSelectorProps> = ({ semester, onAddCourse, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownRef, setDropdownRef] = useState<HTMLDivElement | null>(null);

  const handleSearch = async (term: string) => {
    if (term.length < 2) {
      setCourses([]);
      return;
    }

    try {
      setLoading(true);
      const response = await coursesApi.getAll({ search: term, limit: 10 });
      setCourses(response.courses);
    } catch (err) {
      console.error('Error searching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, dropdownRef]);

  // Position dropdown based on available space
  const getDropdownPosition = () => {
    if (!dropdownRef) return 'bottom';
    
    const rect = dropdownRef.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // If there's not enough space below (less than 300px) and more space above, position upward
    if (spaceBelow < 300 && spaceAbove > 200) {
      return 'top';
    }
    return 'bottom';
  };

  const dropdownPosition = getDropdownPosition();

  if (disabled) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        <MapPin className="h-6 w-6 mx-auto mb-2" />
        <p className="text-sm">Study abroad semester - courses will be planned separately</p>
      </div>
    );
  }

  return (
    <div className="relative" ref={setDropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-center space-x-2 p-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
      >
        <Plus className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500 dark:text-gray-400">Add Course</span>
      </button>

      {isOpen && (
        <div className={`absolute left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-[9999] max-h-80 overflow-y-auto ${
          dropdownPosition === 'top' 
            ? 'bottom-full mb-2' 
            : 'top-full mt-2'
        }`} style={{ 
          zIndex: 9999,
          minWidth: '200px',
          maxWidth: '400px'
        }}>
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {loading && (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            )}
            
            {!loading && courses.length === 0 && searchTerm.length >= 2 && (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No courses found
              </div>
            )}
            
            {courses.map((course) => (
              <button
                key={course.code}
                onClick={() => {
                  onAddCourse(course.code, semester);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                <div className="font-medium text-sm text-gray-900 dark:text-white">
                  {course.code}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {course.title}
                </div>
                <div className="text-xs text-primary-600 dark:text-primary-400">
                  {course.credits} credits
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanningDashboard;
