/**
 * Plan Validation Service
 * Provides real-time validation of academic plans
 */

interface Course {
  code: string;
  title: string;
  credits: number;
  prerequisites: string[];
  termOffered?: string;
}

interface PlanItem {
  course_code: string;
  semester: string;
  plan_item_id?: string;
}

interface ValidationWarning {
  type: 'prerequisite' | 'duplicate' | 'credit_cap' | 'term_offered' | 'requirement';
  severity: 'error' | 'warning';
  message: string;
  course_code?: string;
  semester?: string;
  plan_item_id?: string;
  details?: any;
}

interface ProgramRequirement {
  name: string;
  type: 'all' | 'choice';
  courses: string[];
  credits_needed?: number;
}

interface ValidationResult {
  is_valid: boolean;
  warnings: ValidationWarning[];
  requirements_progress?: RequirementsProgress;
}

interface RequirementsProgress {
  total_requirements: number;
  completed_requirements: number;
  in_progress_requirements: number;
  remaining_requirements: number;
  percentage_complete: number;
  details: RequirementDetail[];
}

interface RequirementDetail {
  group_name: string;
  type: 'all' | 'choice';
  required_courses: string[];
  completed: string[];
  planned: string[];
  remaining: string[];
  is_complete: boolean;
}

export class PlanValidationService {
  private courses: Map<string, Course>;

  constructor(coursesData: Course[]) {
    this.courses = new Map();
    coursesData.forEach(course => {
      this.courses.set(course.code, course);
    });
  }

  /**
   * Validate a complete plan
   */
  validatePlan(
    planItems: PlanItem[],
    programRequirements?: ProgramRequirement[],
    priorCredits?: string[],
    creditCap: number = 16
  ): ValidationResult {
    const warnings: ValidationWarning[] = [];
    const completedCourses = new Set<string>(priorCredits || []);

    // Group items by semester
    const semesterMap = new Map<string, PlanItem[]>();
    planItems.forEach(item => {
      if (!semesterMap.has(item.semester)) {
        semesterMap.set(item.semester, []);
      }
      semesterMap.get(item.semester)!.push(item);
    });

    // Sort semesters chronologically
    const sortedSemesters = Array.from(semesterMap.keys()).sort();

    // Validate each semester
    sortedSemesters.forEach(semester => {
      const items = semesterMap.get(semester)!;

      // Check for duplicates within semester
      const courseCodesInSemester = new Set<string>();
      items.forEach(item => {
        if (courseCodesInSemester.has(item.course_code)) {
          warnings.push({
            type: 'duplicate',
            severity: 'error',
            message: `Duplicate course ${item.course_code} in ${semester}`,
            course_code: item.course_code,
            semester,
            plan_item_id: item.plan_item_id
          });
        }
        courseCodesInSemester.add(item.course_code);
      });

      // Check prerequisites
      items.forEach(item => {
        const course = this.courses.get(item.course_code);
        if (!course) return;

        const missingPrereqs = this.checkPrerequisites(
          course,
          semester,
          sortedSemesters,
          semesterMap,
          completedCourses
        );

        if (missingPrereqs.length > 0) {
          warnings.push({
            type: 'prerequisite',
            severity: 'error',
            message: `${item.course_code} requires: ${missingPrereqs.join(', ')}`,
            course_code: item.course_code,
            semester,
            plan_item_id: item.plan_item_id,
            details: { missing_prerequisites: missingPrereqs }
          });
        }

        // Check term offered
        if (!this.isOfferedInTerm(course, semester)) {
          warnings.push({
            type: 'term_offered',
            severity: 'warning',
            message: `${item.course_code} may not be offered in ${semester}`,
            course_code: item.course_code,
            semester,
            plan_item_id: item.plan_item_id
          });
        }
      });

      // Check credit cap
      const totalCredits = items.reduce((sum, item) => {
        const course = this.courses.get(item.course_code);
        return sum + (course?.credits || 0);
      }, 0);

      if (totalCredits > creditCap) {
        warnings.push({
          type: 'credit_cap',
          severity: 'warning',
          message: `${semester} has ${totalCredits} credits (cap: ${creditCap})`,
          semester,
          details: { total_credits: totalCredits, credit_cap: creditCap }
        });
      }

      // Mark courses as completed after this semester
      items.forEach(item => completedCourses.add(item.course_code));
    });

    // Check for duplicates across all semesters
    const allCourses = new Map<string, string[]>();
    planItems.forEach(item => {
      if (!allCourses.has(item.course_code)) {
        allCourses.set(item.course_code, []);
      }
      allCourses.get(item.course_code)!.push(item.semester);
    });

    allCourses.forEach((semesters, courseCode) => {
      if (semesters.length > 1) {
        warnings.push({
          type: 'duplicate',
          severity: 'error',
          message: `${courseCode} appears in multiple semesters: ${semesters.join(', ')}`,
          course_code: courseCode,
          details: { semesters }
        });
      }
    });

    // Calculate requirements progress if provided
    let requirementsProgress: RequirementsProgress | undefined;
    if (programRequirements && programRequirements.length > 0) {
      requirementsProgress = this.calculateRequirementsProgress(
        planItems,
        programRequirements,
        priorCredits || []
      );
    }

    return {
      is_valid: warnings.filter(w => w.severity === 'error').length === 0,
      warnings,
      requirements_progress: requirementsProgress
    };
  }

  /**
   * Check if prerequisites are met
   */
  private checkPrerequisites(
    course: Course,
    targetSemester: string,
    allSemesters: string[],
    semesterMap: Map<string, PlanItem[]>,
    completedCourses: Set<string>
  ): string[] {
    const missingPrereqs: string[] = [];
    const targetIndex = allSemesters.indexOf(targetSemester);
    const prerequisites = course.prerequisites || [];

    for (const prereq of prerequisites) {
      // Check if in prior credits
      if (completedCourses.has(prereq)) continue;

      // Check if scheduled in previous semester
      let found = false;
      for (let i = 0; i < targetIndex; i++) {
        const items = semesterMap.get(allSemesters[i]) || [];
        if (items.some(item => item.course_code === prereq)) {
          found = true;
          break;
        }
      }

      if (!found) {
        missingPrereqs.push(prereq);
      }
    }

    return missingPrereqs;
  }

  /**
   * Check if course is offered in the given term
   */
  private isOfferedInTerm(course: Course, semester: string): boolean {
    if (!course.termOffered) return true; // If unknown, assume available

    const termOffered = course.termOffered.toLowerCase();
    const isFall = semester.toLowerCase().includes('fall');
    const isSpring = semester.toLowerCase().includes('spring');

    if (isFall && termOffered.includes('fall')) return true;
    if (isSpring && termOffered.includes('spring')) return true;

    return false;
  }

  /**
   * Calculate requirements progress
   */
  private calculateRequirementsProgress(
    planItems: PlanItem[],
    programRequirements: ProgramRequirement[],
    priorCredits: string[]
  ): RequirementsProgress {
    const plannedCourses = new Set(planItems.map(item => item.course_code));
    const completedCourses = new Set(priorCredits);
    const details: RequirementDetail[] = [];

    let totalRequirements = 0;
    let completedRequirements = 0;
    let inProgressRequirements = 0;

    programRequirements.forEach(req => {
      const completed: string[] = [];
      const planned: string[] = [];
      const remaining: string[] = [];

      req.courses.forEach(courseCode => {
        if (completedCourses.has(courseCode)) {
          completed.push(courseCode);
        } else if (plannedCourses.has(courseCode)) {
          planned.push(courseCode);
        } else {
          remaining.push(courseCode);
        }
      });

      const isComplete = req.type === 'all' 
        ? remaining.length === 0 
        : completed.length > 0 || planned.length > 0;

      details.push({
        group_name: req.name,
        type: req.type,
        required_courses: req.courses,
        completed,
        planned,
        remaining,
        is_complete: isComplete
      });

      totalRequirements++;
      if (isComplete && remaining.length === 0) {
        completedRequirements++;
      } else if (planned.length > 0) {
        inProgressRequirements++;
      }
    });

    const percentageComplete = totalRequirements > 0 
      ? Math.round((completedRequirements / totalRequirements) * 100) 
      : 0;

    return {
      total_requirements: totalRequirements,
      completed_requirements: completedRequirements,
      in_progress_requirements: inProgressRequirements,
      remaining_requirements: totalRequirements - completedRequirements - inProgressRequirements,
      percentage_complete: percentageComplete,
      details
    };
  }

  /**
   * Validate a single course addition
   */
  validateCourseAddition(
    courseCode: string,
    semester: string,
    existingPlan: PlanItem[],
    priorCredits?: string[],
    creditCap: number = 16
  ): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    const completedCourses = new Set<string>(priorCredits || []);

    // Check if course already exists in plan
    const existingInPlan = existingPlan.some(item => item.course_code === courseCode);
    if (existingInPlan) {
      warnings.push({
        type: 'duplicate',
        severity: 'error',
        message: `${courseCode} is already in your plan`,
        course_code: courseCode,
        semester
      });
    }

    // Get course data
    const course = this.courses.get(courseCode);
    if (!course) {
      warnings.push({
        type: 'requirement',
        severity: 'warning',
        message: `Course ${courseCode} not found in catalog`,
        course_code: courseCode,
        semester
      });
      return warnings;
    }

    // Group existing plan by semester
    const semesterMap = new Map<string, PlanItem[]>();
    existingPlan.forEach(item => {
      if (!semesterMap.has(item.semester)) {
        semesterMap.set(item.semester, []);
      }
      semesterMap.get(item.semester)!.push(item);
    });

    // Mark courses before target semester as completed
    const sortedSemesters = Array.from(semesterMap.keys()).sort();
    sortedSemesters.forEach(sem => {
      if (sem < semester) {
        semesterMap.get(sem)!.forEach(item => {
          completedCourses.add(item.course_code);
        });
      }
    });

    // Check prerequisites
    const missingPrereqs = (course.prerequisites || []).filter(prereq => 
      !completedCourses.has(prereq) && 
      !existingPlan.some(item => item.course_code === prereq && item.semester < semester)
    );

    if (missingPrereqs.length > 0) {
      warnings.push({
        type: 'prerequisite',
        severity: 'error',
        message: `${courseCode} requires: ${missingPrereqs.join(', ')}`,
        course_code: courseCode,
        semester,
        details: { missing_prerequisites: missingPrereqs }
      });
    }

    // Check credit cap for semester
    const semesterItems = semesterMap.get(semester) || [];
    const currentCredits = semesterItems.reduce((sum, item) => {
      const c = this.courses.get(item.course_code);
      return sum + (c?.credits || 0);
    }, 0);

    if (currentCredits + course.credits > creditCap) {
      warnings.push({
        type: 'credit_cap',
        severity: 'warning',
        message: `Adding ${courseCode} would exceed credit cap (${currentCredits + course.credits}/${creditCap})`,
        course_code: courseCode,
        semester,
        details: { 
          current_credits: currentCredits, 
          course_credits: course.credits,
          total: currentCredits + course.credits,
          credit_cap: creditCap 
        }
      });
    }

    // Check term offered
    if (!this.isOfferedInTerm(course, semester)) {
      warnings.push({
        type: 'term_offered',
        severity: 'warning',
        message: `${courseCode} may not be offered in ${semester}`,
        course_code: courseCode,
        semester
      });
    }

    return warnings;
  }
}

