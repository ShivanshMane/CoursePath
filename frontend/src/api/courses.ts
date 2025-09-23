import api from './client';

export interface Course {
  code: string;
  title: string;
  credits: number;
  description: string;
  prerequisites: string[];
  corequisites: string[];
  typicalTerms: string[];
  department: string;
  level: string;
  offered: boolean;
  genEdCategories: string[];
}

export interface CoursesResponse {
  courses: Course[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface CourseFilters {
  department?: string;
  level?: string;
  term?: string;
  genEd?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export const coursesApi = {
  // Get all courses with optional filtering
  getAll: async (filters?: CourseFilters): Promise<CoursesResponse> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await api.get(`/courses?${params.toString()}`);
    return response.data.data;
  },

  // Get a specific course by code
  getByCode: async (code: string): Promise<Course> => {
    const response = await api.get(`/courses/${code}`);
    return response.data.data;
  },

  // Get all courses in a specific department
  getByDepartment: async (department: string): Promise<Course[]> => {
    const response = await api.get(`/courses/department/${department}`);
    return response.data.data;
  },

  // Get courses that have a specific course as a prerequisite
  getDependentCourses: async (code: string): Promise<Course[]> => {
    const response = await api.get(`/courses/prerequisites/${code}`);
    return response.data.data;
  },
};
