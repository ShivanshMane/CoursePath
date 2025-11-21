import React, { useState, useEffect } from 'react';
import { programsApi, Program, GeneralEducation } from '../api/programs';
import { BookOpen, GraduationCap, Users, Search } from 'lucide-react';
import CourseDetail from './CourseDetail';

const RequirementsBrowser: React.FC = () => {
  const [majors, setMajors] = useState<Program[]>([]);
  const [minors, setMinors] = useState<Program[]>([]);
  const [generalEducation, setGeneralEducation] = useState<GeneralEducation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'majors' | 'minors' | 'general'>('majors');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<Program | GeneralEducation | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [isCourseDetailOpen, setIsCourseDetailOpen] = useState(false);

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [majorsData, minorsData, genEdData] = await Promise.all([
        programsApi.getMajors(),
        programsApi.getMinors(),
        programsApi.getGeneralEducation()
      ]);
      
      setMajors(majorsData);
      setMinors(minorsData);
      setGeneralEducation(genEdData);
    } catch (err) {
      console.error('Error loading programs:', err);
      setError('Failed to load programs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPrograms = () => {
    const programs = activeTab === 'majors' ? majors : activeTab === 'minors' ? minors : [];
    
    if (!searchTerm) return programs;
    
    return programs.filter(program =>
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getCreditsText = (credits: number) => {
    return `${credits} credit${credits !== 1 ? 's' : ''}`;
  };

  const handleCourseClick = (courseCode: string) => {
    setSelectedCourse(courseCode);
    setIsCourseDetailOpen(true);
  };

  const handleCloseCourseDetail = () => {
    setIsCourseDetailOpen(false);
    setSelectedCourse(null);
  };

  const renderProgramCard = (program: Program) => (
    <div
      key={program.id}
      onClick={() => setSelectedProgram(program)}
      className="group relative glass-card p-6 hover-lift cursor-pointer overflow-hidden"
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-yellow-600/5 to-yellow-700/5 dark:from-blue-600/5 dark:via-blue-700/5 dark:to-blue-800/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 dark:from-blue-600/10 dark:to-blue-700/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-blue-100 dark:to-blue-200 rounded-xl group-hover:from-yellow-200 group-hover:to-yellow-300 dark:group-hover:from-blue-200 dark:group-hover:to-blue-300 transition-all duration-300 shadow-lg">
                  <GraduationCap className="w-6 h-6 text-yellow-600 dark:text-blue-600 group-hover:text-yellow-700 dark:group-hover:text-blue-700 transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-700 dark:from-blue-500 to-blue-600 bg-clip-text text-transparent group-hover:from-yellow-700 group-hover:to-yellow-800 dark:group-hover:from-blue-600 dark:group-hover:to-blue-700 transition-all duration-300">
                {program.name}
              </h3>
            </div>
            <p className="text-sm font-semibold text-gray-500 mb-3 capitalize">{program.type}</p>
            <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2 leading-relaxed">Academic program requirements and course structure</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-blue-100 dark:to-blue-200 text-yellow-800 dark:text-blue-800 group-hover:from-yellow-200 group-hover:to-yellow-300 dark:group-hover:from-blue-200 dark:group-hover:to-blue-300 transition-all duration-300 shadow-md">
            {getCreditsText(program.totalCredits)}
          </span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gradient-to-r from-yellow-500 to-yellow-600 dark:from-blue-500 to-blue-600 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-gray-500 capitalize">{program.type}</span>
          </div>
        </div>
      </div>
      
      {/* Hover arrow */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
        <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-yellow-600 dark:from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
          <div className="w-0 h-0 border-l-4 border-l-white border-y-4 border-y-transparent"></div>
        </div>
      </div>
    </div>
  );

  const renderGeneralEducationCard = () => {
    if (!generalEducation) return null;

    return (
      <div
        onClick={() => setSelectedProgram(generalEducation)}
        className="group relative glass-card p-6 hover-lift cursor-pointer overflow-hidden"
      >
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-yellow-600/5 to-yellow-700/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl group-hover:from-yellow-200 group-hover:to-yellow-300 transition-all duration-300 shadow-lg">
                  <BookOpen className="w-6 h-6 text-yellow-600 group-hover:text-yellow-700 transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold text-black dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-all duration-300">
                  {generalEducation.name}
                </h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2 leading-relaxed">{generalEducation.description}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 group-hover:from-yellow-200 group-hover:to-yellow-300 transition-all duration-300 shadow-md">
              {getCreditsText(generalEducation.totalCredits)}
            </span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-gray-500">General Education</span>
            </div>
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

  const renderProgramDetails = () => {
    if (!selectedProgram) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{selectedProgram.name}</h2>
              <button
                onClick={() => setSelectedProgram(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 mt-2">Academic program requirements and course structure</p>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="space-y-6">
              {'requirementGroups' in selectedProgram ? 
                // Check if this is a flat list of courses (single requirement group with many courses)
                selectedProgram.requirementGroups.length === 1 && 
                selectedProgram.requirementGroups[0].courses.length > 10 ? (
                  // Display as a better organized single list
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Program Requirements</h3>
                      <p className="text-sm text-gray-600">
                        All {selectedProgram.requirementGroups[0].courses.length} courses listed below are required for this major.
                      </p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {selectedProgram.requirementGroups[0].courses.map((course, courseIndex) => (
                          <button
                            key={courseIndex}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCourseClick(course);
                            }}
                            className="text-left p-3 bg-gray-50 hover:bg-primary-50 rounded-md border border-gray-200 hover:border-primary-300 transition-all duration-200"
                          >
                            <span className="font-medium text-gray-900 block">{course}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Display requirement groups with proper structure
                  selectedProgram.requirementGroups.map((requirement, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{requirement.name}</h3>
                      <p className="text-sm text-gray-500 mb-3">
                        Type: {requirement.type === 'all' ? 'All courses required' : 'Choose any courses'}
                      </p>
                      {requirement.courses && requirement.courses.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {requirement.courses.map((course, courseIndex) => (
                            <button
                              key={courseIndex}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCourseClick(course);
                              }}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-primary-100 hover:text-primary-800 transition-colors cursor-pointer"
                            >
                              {course}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) :
                selectedProgram.requirements.map((requirement, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{requirement.category}</h3>
                    {requirement.description && (
                      <p className="text-gray-600 mb-3">{requirement.description}</p>
                    )}
                    {requirement.credits && (
                      <p className="text-sm text-gray-500 mb-3">
                        Credits: {requirement.credits}
                      </p>
                    )}
                    {requirement.courses && requirement.courses.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {requirement.courses.map((course, courseIndex) => (
                          <button
                            key={courseIndex}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCourseClick(course);
                            }}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-primary-100 hover:text-primary-800 transition-colors cursor-pointer"
                          >
                            {course}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center">
          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full"></div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Oops! Something went wrong</h3>
        <p className="text-red-600 mb-6">{error}</p>
        <button onClick={loadPrograms} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 slide-up">
      {/* Header */}
      <div className="text-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-yellow-600/10 to-yellow-700/10 dark:from-blue-600/10 dark:via-blue-700/10 dark:to-blue-800/10 rounded-3xl blur-2xl"></div>
        <div className="relative glass-card p-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 via-yellow-700 to-yellow-800 dark:from-blue-500 dark:via-blue-600 dark:to-blue-700 bg-clip-text text-transparent mb-4">
            Requirements Browser
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">Explore DePauw's academic programs and requirements</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 dark:from-blue-600/20 dark:to-blue-700/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-yellow-600 dark:text-blue-500 group-hover:text-yellow-700 dark:group-hover:text-blue-600 transition-colors duration-300" />
            </div>
            <input
              type="text"
              placeholder="Search programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-yellow-200/50 dark:border-blue-300/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-yellow-300/50 dark:focus:ring-blue-500/50 focus:border-yellow-500 dark:focus:border-blue-500 transition-all duration-300 placeholder-gray-400 dark:placeholder-gray-500 text-gray-700 dark:text-gray-200 font-medium shadow-lg hover:shadow-xl"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-yellow-600/10 to-yellow-700/10 rounded-2xl blur-xl"></div>
          <div className="relative glass-card p-2">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('majors')}
                className={`group relative flex-1 flex items-center justify-center space-x-3 py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  activeTab === 'majors'
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 dark:from-blue-600 to-blue-700 text-black dark:text-white shadow-lg scale-105'
                    : 'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gradient-to-r hover:from-yellow-500 hover:to-yellow-600 dark:hover:from-blue-600 dark:hover:to-blue-700 hover:scale-105'
                }`}
              >
                <GraduationCap className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                <span>Majors ({majors.length})</span>
                {activeTab === 'majors' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 dark:from-blue-500/20 dark:to-blue-600/20 rounded-xl blur-sm"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('minors')}
                className={`group relative flex-1 flex items-center justify-center space-x-3 py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  activeTab === 'minors'
                    ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 dark:from-blue-700 to-blue-800 text-black dark:text-white shadow-lg scale-105'
                    : 'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gradient-to-r hover:from-yellow-500 hover:to-yellow-600 dark:hover:from-blue-700 dark:hover:to-blue-800 hover:scale-105'
                }`}
              >
                <Users className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                <span>Minors ({minors.length})</span>
                {activeTab === 'minors' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 dark:from-blue-600/20 dark:to-blue-700/20 rounded-xl blur-sm"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('general')}
                className={`group relative flex-1 flex items-center justify-center space-x-3 py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  activeTab === 'general'
                    ? 'bg-gradient-to-r from-yellow-700 to-yellow-800 dark:from-blue-800 to-blue-900 text-black dark:text-white shadow-lg scale-105'
                    : 'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gradient-to-r hover:from-yellow-500 hover:to-yellow-600 dark:hover:from-blue-800 dark:hover:to-blue-900 hover:scale-105'
                }`}
              >
                <BookOpen className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                <span>Gen Ed</span>
                {activeTab === 'general' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 to-yellow-700/20 dark:from-blue-700/20 dark:to-blue-800/20 rounded-xl blur-sm"></div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {activeTab === 'general' ? (
          <div className="slide-in">
            {renderGeneralEducationCard()}
          </div>
        ) : (
          getFilteredPrograms().map((program, index) => (
            <div key={program.id} className="slide-in" style={{ animationDelay: `${index * 50}ms` }}>
              {renderProgramCard(program)}
            </div>
          ))
        )}
      </div>

      {/* Empty State */}
      {getFilteredPrograms().length === 0 && activeTab !== 'general' && (
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center">
            <Users className="w-10 h-10 text-yellow-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No programs found</h3>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-6">Try adjusting your search terms or filters.</p>
          <button 
            onClick={() => setSearchTerm('')}
            className="btn-primary"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Program Details Modal */}
      {renderProgramDetails()}

      {/* Course Detail Modal */}
      {selectedCourse && (
        <CourseDetail
          courseCode={selectedCourse}
          isOpen={isCourseDetailOpen}
          onClose={handleCloseCourseDetail}
        />
      )}
    </div>
  );
};

export default RequirementsBrowser;
