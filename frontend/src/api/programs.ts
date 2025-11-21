import api from './client';

export interface Program {
  id: string;
  name: string;
  type: 'Major' | 'Minor' | 'general';
  totalCredits: number;
  requirementGroups: ProgramRequirementGroup[];
}

export interface ProgramRequirementGroup {
  name: string;
  type: 'all' | 'any';
  courses: string[];
}

export interface ProgramRequirement {
  category: string;
  credits?: number;
  description?: string;
  courses?: string[];
}

export interface GeneralEducation {
  id: string;
  name: string;
  type: 'general';
  description: string;
  totalCredits: number;
  requirements: ProgramRequirement[];
}

export interface ProgramsResponse {
  success: boolean;
  data: Program[];
}

export const programsApi = {
  // Get all programs (majors, minors, and general education)
  getAll: async (): Promise<Program[]> => {
    const response = await api.get('/programs');
    return response.data.data;
  },

  // Get all majors
  getMajors: async (): Promise<Program[]> => {
    const response = await api.get('/programs/majors');
    return response.data.data;
  },

  // Get all minors
  getMinors: async (): Promise<Program[]> => {
    const response = await api.get('/programs/minors');
    return response.data.data;
  },

  // Get general education requirements
  getGeneralEducation: async (): Promise<GeneralEducation | null> => {
    const response = await api.get('/programs/general-education');
    return response.data.data.length > 0 ? response.data.data[0] : null;
  },

  // Get a specific program by ID
  getById: async (id: string): Promise<Program | GeneralEducation> => {
    const response = await api.get(`/programs/${id}`);
    return response.data.data;
  },
};
