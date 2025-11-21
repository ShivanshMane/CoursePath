import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types
export interface UserPreferences {
  early_graduation?: {
    target_term?: string;
    target_year?: number;
  };
  prior_credits?: {
    ap_credits?: number;
    transfer_credits?: number;
    completed_courses?: string[];
  };
  double_major?: boolean;
  minor?: string;
  study_abroad?: {
    term?: string;
    year?: number;
  };
}

export interface Plan {
  plan_id: string;
  user_id: string;
  catalog_year: number;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
}

export interface PlanItem {
  plan_item_id: string;
  plan_id: string;
  course_code: string;
  semester: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PlanWithItems extends Plan {
  items: PlanItem[];
}

export interface SemesterPlan {
  semester: string;
  items: PlanItem[];
  total_credits: number;
}

export interface CreatePlanItemRequest {
  course_code: string;
  semester: string;
  notes?: string;
}

export interface UpdatePlanItemRequest {
  semester?: string;
  notes?: string;
}

export interface UpdatePlanRequest {
  catalog_year?: number;
  preferences?: UserPreferences;
}

export interface ValidationWarning {
  type: 'prerequisite' | 'duplicate' | 'credit_cap' | 'term_offered' | 'requirement';
  severity: 'error' | 'warning';
  message: string;
  course_code?: string;
  semester?: string;
  plan_item_id?: string;
  details?: any;
}

export interface RequirementDetail {
  group_name: string;
  type: 'all' | 'choice';
  required_courses: string[];
  completed: string[];
  planned: string[];
  remaining: string[];
  is_complete: boolean;
}

export interface RequirementsProgress {
  total_requirements: number;
  completed_requirements: number;
  in_progress_requirements: number;
  remaining_requirements: number;
  percentage_complete: number;
  details: RequirementDetail[];
}

export interface ValidationResult {
  is_valid: boolean;
  warnings: ValidationWarning[];
  requirements_progress?: RequirementsProgress;
}

export interface GeneratedPlanItem {
  course_code: string;
  semester: string;
  credits: number;
  is_locked?: boolean;
}

// API class
class PlansApi {
  private getHeaders(userId?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (userId) {
      headers['x-user-id'] = userId;
    }
    
    return headers;
  }

  async getPlan(userId: string): Promise<PlanWithItems | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/plans`, {
        headers: this.getHeaders(userId),
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getSemesterPlan(userId: string): Promise<SemesterPlan[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/plans/semester-view`, {
        headers: this.getHeaders(userId),
      });
      return response.data;
    } catch (error) {
      console.error('Error getting semester plan:', error);
      return [];
    }
  }

  async createPlan(userId: string, planData?: { catalog_year?: number; preferences?: UserPreferences }): Promise<Plan> {
    const response = await axios.post(`${API_BASE_URL}/plans`, planData, {
      headers: this.getHeaders(userId),
    });
    return response.data;
  }

  async updatePlan(userId: string, updates: UpdatePlanRequest): Promise<Plan> {
    const response = await axios.put(`${API_BASE_URL}/plans`, updates, {
      headers: this.getHeaders(userId),
    });
    return response.data;
  }

  async addCourseToPlan(userId: string, courseData: CreatePlanItemRequest): Promise<PlanItem> {
    const response = await axios.post(`${API_BASE_URL}/plans/items`, courseData, {
      headers: this.getHeaders(userId),
    });
    return response.data;
  }

  async updatePlanItem(userId: string, itemId: string, updates: UpdatePlanItemRequest): Promise<PlanItem> {
    const response = await axios.put(`${API_BASE_URL}/plans/items/${itemId}`, updates, {
      headers: this.getHeaders(userId),
    });
    return response.data;
  }

  async removeCourseFromPlan(userId: string, itemId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/plans/items/${itemId}`, {
      headers: this.getHeaders(userId),
    });
  }

  async generatePlan(
    userId: string,
    programId: string,
    preferences?: UserPreferences,
    creditCap?: number,
    creditMin?: number
  ): Promise<GeneratedPlanItem[]> {
    const response = await axios.post(
      `${API_BASE_URL}/plans/generate`,
      {
        program_id: programId,
        preferences,
        credit_cap: creditCap,
        credit_min: creditMin,
      },
      {
        headers: this.getHeaders(userId),
      }
    );
    return response.data.data;
  }

  async validatePlan(
    userId: string,
    programId?: string,
    creditCap?: number
  ): Promise<ValidationResult> {
    const response = await axios.post(
      `${API_BASE_URL}/plans/validate`,
      {
        program_id: programId,
        credit_cap: creditCap,
      },
      {
        headers: this.getHeaders(userId),
      }
    );
    return response.data.data;
  }

  async validateCourseAddition(
    userId: string,
    courseCode: string,
    semester: string,
    creditCap?: number
  ): Promise<{ is_valid: boolean; warnings: ValidationWarning[] }> {
    const response = await axios.post(
      `${API_BASE_URL}/plans/validate-course`,
      {
        course_code: courseCode,
        semester,
        credit_cap: creditCap,
      },
      {
        headers: this.getHeaders(userId),
      }
    );
    return response.data.data;
  }
}

export const plansApi = new PlansApi();
