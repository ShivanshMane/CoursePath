/**
 * Plan Generation Service
 * Implements automatic semester-by-semester plan generation
 * Uses DAG and topological sort to respect prerequisites
 */

interface Course {
  code: string;
  title: string;
  credits: number;
  prerequisites: string[];
  termOffered?: string;
}

interface GeneratedPlanItem {
  course_code: string;
  semester: string;
  credits: number;
  is_locked?: boolean;
}

interface UserPreferences {
  early_graduation?: {
    target_term?: string;
    target_year?: number;
  };
  prior_credits?: {
    ap_credits?: number;
    transfer_credits?: number;
    completed_courses?: string[];
  };
  study_abroad?: {
    term?: string;
    year?: number;
  };
}

interface PlanGenerationOptions {
  required_courses: string[];
  existing_plan?: GeneratedPlanItem[];
  preferences?: UserPreferences;
  credit_cap?: number;
  credit_min?: number;
  start_year?: number;
}

interface PrerequisiteNode {
  course: string;
  prerequisites: string[];
  visited: boolean;
  inStack: boolean;
}

export class PlanGenerationService {
  private courses: Map<string, Course>;
  private creditCap: number;
  private creditMin: number;

  constructor(coursesData: Course[]) {
    this.courses = new Map();
    coursesData.forEach(course => {
      this.courses.set(course.code, course);
    });
    this.creditCap = 16;
    this.creditMin = 12;
  }

  /**
   * Generate a complete semester-by-semester plan
   */
  generatePlan(options: PlanGenerationOptions): GeneratedPlanItem[] {
    const {
      required_courses,
      existing_plan = [],
      preferences = {},
      credit_cap = 16,
      credit_min = 12,
      start_year = new Date().getFullYear()
    } = options;

    this.creditCap = credit_cap;
    this.creditMin = credit_min;

    // Filter out completed courses (prior credits)
    const completedCourses = new Set(preferences.prior_credits?.completed_courses || []);
    const coursesToSchedule = required_courses.filter(code => !completedCourses.has(code));

    // Extract locked courses from existing plan
    const lockedCourses = new Map<string, string>();
    existing_plan.forEach(item => {
      if (item.is_locked) {
        lockedCourses.set(item.course_code, item.semester);
      }
    });

    // Remove locked courses from courses to schedule
    const unlockedCourses = coursesToSchedule.filter(code => !lockedCourses.has(code));

    // Build prerequisite graph
    const graph = this.buildPrerequisiteGraph(coursesToSchedule);

    // Detect cycles
    if (this.hasCycle(graph)) {
      throw new Error('Prerequisite cycle detected in course requirements');
    }

    // Perform topological sort
    const sortedCourses = this.topologicalSort(graph, unlockedCourses);

    // Generate semester list
    const semesters = this.generateSemesters(start_year, preferences);

    // Place courses into semesters
    const plan = this.placeCourses(
      sortedCourses,
      lockedCourses,
      semesters,
      preferences
    );

    return plan;
  }

  /**
   * Build a directed acyclic graph of prerequisites
   */
  private buildPrerequisiteGraph(courseList: string[]): Map<string, PrerequisiteNode> {
    const graph = new Map<string, PrerequisiteNode>();

    courseList.forEach(courseCode => {
      const course = this.courses.get(courseCode);
      if (!course) return;

      const prerequisites = course.prerequisites || [];
      
      graph.set(courseCode, {
        course: courseCode,
        prerequisites: prerequisites.filter(prereq => courseList.includes(prereq)),
        visited: false,
        inStack: false
      });
    });

    return graph;
  }

  /**
   * Detect cycles in the prerequisite graph using DFS
   */
  private hasCycle(graph: Map<string, PrerequisiteNode>): boolean {
    const detectCycle = (node: string): boolean => {
      const current = graph.get(node);
      if (!current) return false;
      
      if (current.inStack) return true;
      if (current.visited) return false;

      current.visited = true;
      current.inStack = true;

      for (const prereq of current.prerequisites) {
        if (detectCycle(prereq)) {
          return true;
        }
      }

      current.inStack = false;
      return false;
    };

    // Reset visited flags
    graph.forEach(node => {
      node.visited = false;
      node.inStack = false;
    });

    for (const courseCode of graph.keys()) {
      if (!graph.get(courseCode)!.visited) {
        if (detectCycle(courseCode)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Perform topological sort on the prerequisite graph
   */
  private topologicalSort(
    graph: Map<string, PrerequisiteNode>,
    coursesToSort: string[]
  ): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();

    const visit = (courseCode: string) => {
      if (visited.has(courseCode)) return;
      
      const node = graph.get(courseCode);
      if (!node) return;

      // Visit all prerequisites first
      for (const prereq of node.prerequisites) {
        visit(prereq);
      }

      visited.add(courseCode);
      sorted.push(courseCode);
    };

    coursesToSort.forEach(courseCode => visit(courseCode));

    return sorted;
  }

  /**
   * Generate list of semesters
   */
  private generateSemesters(
    startYear: number,
    preferences: UserPreferences
  ): string[] {
    const semesters: string[] = [];
    const targetYear = preferences.early_graduation?.target_year || (startYear + 4);
    const yearsNeeded = targetYear - startYear;

    for (let year = startYear; year < startYear + Math.max(yearsNeeded, 4); year++) {
      semesters.push(`${year} Fall`);
      semesters.push(`${year + 1} Spring`);
    }

    return semesters;
  }

  /**
   * Place courses into semesters respecting all constraints
   */
  private placeCourses(
    sortedCourses: string[],
    lockedCourses: Map<string, string>,
    semesters: string[],
    preferences: UserPreferences
  ): GeneratedPlanItem[] {
    const plan: GeneratedPlanItem[] = [];
    const completedCourses = new Set<string>(preferences.prior_credits?.completed_courses || []);
    const semesterCourses = new Map<string, string[]>();
    const semesterCredits = new Map<string, number>();

    // Initialize semester maps
    semesters.forEach(sem => {
      semesterCourses.set(sem, []);
      semesterCredits.set(sem, 0);
    });

    // Add locked courses first
    lockedCourses.forEach((semester, courseCode) => {
      const course = this.courses.get(courseCode);
      if (!course) return;

      const courses = semesterCourses.get(semester) || [];
      courses.push(courseCode);
      semesterCourses.set(semester, courses);

      const credits = semesterCredits.get(semester) || 0;
      semesterCredits.set(semester, credits + course.credits);

      plan.push({
        course_code: courseCode,
        semester,
        credits: course.credits,
        is_locked: true
      });

      completedCourses.add(courseCode);
    });

    // Place remaining courses
    let placedCount = 0;
    let skippedCount = 0;
    
    for (const courseCode of sortedCourses) {
      if (lockedCourses.has(courseCode)) continue;

      let course = this.courses.get(courseCode);
      
      // If course doesn't exist in database, create a placeholder
      if (!course) {
        console.log(`⚠️ Course not found in database: ${courseCode}, using placeholder`);
        course = {
          code: courseCode,
          title: `${courseCode} Course`,
          credits: 1, // Default to 1 credit
          prerequisites: [],
          termOffered: 'Fall, Spring' // Available all terms
        };
      }

      let placed = false;
      
      // Find the first valid semester
      for (const semester of semesters) {
        // Skip study abroad semester
        if (this.isStudyAbroadSemester(semester, preferences)) {
          console.log(`  ⏭️ ${courseCode}: Skipping ${semester} (study abroad)`);
          continue;
        }

        // Check if all prerequisites are met
        if (!this.arePrerequisitesMet(course, semester, semesters, semesterCourses, completedCourses)) {
          console.log(`  ⏭️ ${courseCode}: Skipping ${semester} (prerequisites not met)`);
          continue;
        }

        // Check term offered
        if (!this.isOfferedInTerm(course, semester)) {
          console.log(`  ⏭️ ${courseCode}: Skipping ${semester} (not offered this term)`);
          continue;
        }

        // Check course count limit (max 4 courses per semester)
        const currentCourses = semesterCourses.get(semester) || [];
        if (currentCourses.length >= 4) {
          console.log(`  ⏭️ ${courseCode}: Skipping ${semester} (already has 4 courses)`);
          continue;
        }
        
        console.log(`  ✅ ${courseCode}: Placing in ${semester}`);

        // Place the course
        const courses = semesterCourses.get(semester) || [];
        courses.push(courseCode);
        semesterCourses.set(semester, courses);

        const currentCredits = semesterCredits.get(semester) || 0;
        semesterCredits.set(semester, currentCredits + course.credits);

        plan.push({
          course_code: courseCode,
          semester,
          credits: course.credits,
          is_locked: false
        });

        // Mark as completed so future courses can use it as a prerequisite
        completedCourses.add(courseCode);

        placedCount++;
        placed = true;
        break;
      }
      
      if (!placed) {
        console.log(`⚠️ Could not place course: ${courseCode}`);
        skippedCount++;
      }
    }
    
    console.log(`✅ Plan generation complete: ${placedCount} courses placed, ${skippedCount} courses skipped`);
    console.log(`📊 Semesters used:`, Array.from(semesterCourses.entries()).map(([sem, courses]) => `${sem}: ${courses.length} courses`));

    return plan;
  }

  /**
   * Check if all prerequisites for a course are met in previous semesters
   */
  private arePrerequisitesMet(
    course: Course,
    targetSemester: string,
    allSemesters: string[],
    semesterCourses: Map<string, string[]>,
    completedCourses: Set<string>
  ): boolean {
    const targetIndex = allSemesters.indexOf(targetSemester);
    const prerequisites = course.prerequisites || [];

    for (const prereq of prerequisites) {
      // Check if it's in prior credits
      if (completedCourses.has(prereq)) continue;

      // Check if it's scheduled in a previous semester
      let found = false;
      for (let i = 0; i < targetIndex; i++) {
        const semesterCourseList = semesterCourses.get(allSemesters[i]) || [];
        if (semesterCourseList.includes(prereq)) {
          found = true;
          break;
        }
      }

      if (!found) return false;
    }

    return true;
  }

  /**
   * Check if a course is offered in the given term
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
   * Check if a semester is the study abroad semester
   */
  private isStudyAbroadSemester(semester: string, preferences: UserPreferences): boolean {
    if (!preferences.study_abroad) return false;

    const studyAbroadSemester = `${preferences.study_abroad.year} ${preferences.study_abroad.term}`;
    return semester === studyAbroadSemester;
  }

  /**
   * Get course by code
   */
  getCourse(courseCode: string): Course | undefined {
    return this.courses.get(courseCode);
  }
}

