import React, { useState, useEffect } from 'react';
import { programsApi, Program, GeneralEducation } from '../api/programs';
import { BookOpen, GraduationCap, Users, Search, Filter } from 'lucide-react';

const RequirementsBrowser: React.FC = () => {
  const [majors, setMajors] = useState<Program[]>([]);
  const [minors, setMinors] = useState<Program[]>([]);
  const [generalEducation, setGeneralEducation] = useState<GeneralEducation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'majors' | 'minors' | 'general'>('majors');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<Program | GeneralEducation | null>(null);

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
      program.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getCreditsText = (credits: number) => {
    return `${credits} credit${credits !== 1 ? 's' : ''}`;
  };

  const renderProgramCard = (program: Program) => (
    <div
      key={program.id}
      onClick={() => setSelectedProgram(program)}
      className="card-hover group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-lg">
              <GraduationCap className="w-4 h-4 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              {program.name}
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-2">{program.department}</p>
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">{program.description}</p>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              {getCreditsText(program.credits)}
            </span>
            <span className="text-xs text-gray-500 capitalize">{program.type}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGeneralEducationCard = () => {
    if (!generalEducation) return null;

    return (
      <div
        onClick={() => setSelectedProgram(generalEducation)}
        className="card-hover group"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                <BookOpen className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                {generalEducation.name}
              </h3>
            </div>
            <p className="text-sm text-gray-700 mb-3 line-clamp-2">{generalEducation.description}</p>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {getCreditsText(generalEducation.totalCredits)}
              </span>
              <span className="text-xs text-gray-500">General Education</span>
            </div>
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
            <p className="text-gray-600 mt-2">{selectedProgram.description}</p>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="space-y-6">
              {selectedProgram.requirements.map((requirement, index) => (
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
                        <span
                          key={courseIndex}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                        >
                          {course}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
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
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button onClick={loadPrograms} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Requirements Browser</h1>
        <p className="text-gray-600">Explore DePauw's academic programs and requirements</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search programs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('majors')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'majors'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Majors ({majors.length})
          </button>
          <button
            onClick={() => setActiveTab('minors')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'minors'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Minors ({minors.length})
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'general'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Gen Ed
          </button>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'general' ? (
          renderGeneralEducationCard()
        ) : (
          getFilteredPrograms().map(renderProgramCard)
        )}
      </div>

      {/* Empty State */}
      {getFilteredPrograms().length === 0 && activeTab !== 'general' && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No programs found</h3>
          <p className="text-gray-500">Try adjusting your search terms or filters.</p>
        </div>
      )}

      {/* Program Details Modal */}
      {renderProgramDetails()}
    </div>
  );
};

export default RequirementsBrowser;
