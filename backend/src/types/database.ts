// Database type definitions for CoursePath

export interface User {
  user_id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Program {
  program_id: string;
  name: string;
  type: 'major' | 'minor';
  requirements: Record<string, any>;
  created_at: string;
}

export interface Course {
  course_code: string;
  title: string;
  credits: number;
  description?: string;
  prereqs?: string[];
  terms_offered?: string[];
  created_at: string;
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

// Request/Response types for API endpoints
export interface CreatePlanRequest {
  catalog_year?: number;
  preferences?: UserPreferences;
}

export interface UpdatePlanRequest {
  catalog_year?: number;
  preferences?: UserPreferences;
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

export interface PlanWithItems extends Plan {
  items: PlanItem[];
}

export interface SemesterPlan {
  semester: string;
  items: PlanItem[];
  total_credits: number;
}
