import  pool  from '../config/database';
import { Plan, PlanItem, PlanWithItems, CreatePlanRequest, UpdatePlanRequest, CreatePlanItemRequest, UpdatePlanItemRequest, SemesterPlan } from '../types/database';

export class PlanModel {
  // Create a new plan
  static async create(userId: string, planData: CreatePlanRequest = {}): Promise<Plan> {
    const query = `
      INSERT INTO plans (user_id, catalog_year, preferences)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [
      userId,
      planData.catalog_year || new Date().getFullYear(),
      JSON.stringify(planData.preferences || {})
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Find plan by user ID
  static async findByUserId(userId: string): Promise<Plan | null> {
    const query = 'SELECT * FROM plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1';
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  // Find plan by ID
  static async findById(planId: string): Promise<Plan | null> {
    const query = 'SELECT * FROM plans WHERE plan_id = $1';
    const result = await pool.query(query, [planId]);
    return result.rows[0] || null;
  }

  // Update plan
  static async update(planId: string, updates: UpdatePlanRequest): Promise<Plan> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.catalog_year !== undefined) {
      fields.push(`catalog_year = $${paramCount++}`);
      values.push(updates.catalog_year);
    }
    if (updates.preferences !== undefined) {
      fields.push(`preferences = $${paramCount++}`);
      values.push(JSON.stringify(updates.preferences));
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(planId);
    const query = `
      UPDATE plans 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE plan_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete plan
  static async delete(planId: string): Promise<void> {
    const query = 'DELETE FROM plans WHERE plan_id = $1';
    await pool.query(query, [planId]);
  }

  // Get plan with all items
  static async getPlanWithItems(userId: string): Promise<PlanWithItems | null> {
    const plan = await this.findByUserId(userId);
    if (!plan) return null;

    const items = await PlanItemModel.findByPlanId(plan.plan_id);
    return {
      ...plan,
      items
    };
  }

  // Get semester-organized plan
  static async getSemesterPlan(userId: string): Promise<SemesterPlan[]> {
    const plan = await this.findByUserId(userId);
    if (!plan) return [];

    const items = await PlanItemModel.findByPlanId(plan.plan_id);
    
    // Group items by semester
    const semesterMap = new Map<string, PlanItem[]>();
    
    items.forEach(item => {
      if (!semesterMap.has(item.semester)) {
        semesterMap.set(item.semester, []);
      }
      semesterMap.get(item.semester)!.push(item);
    });

    // Convert to array and calculate credits
    const semesterPlans: SemesterPlan[] = [];
    
    for (const [semester, semesterItems] of semesterMap) {
      // Get course credits for each item
      const itemsWithCredits = await Promise.all(
        semesterItems.map(async (item) => {
          const course = await pool.query('SELECT credits FROM courses WHERE course_code = $1', [item.course_code]);
          return {
            ...item,
            credits: course.rows[0]?.credits || 0
          };
        })
      );

      const totalCredits = itemsWithCredits.reduce((sum, item) => sum + item.credits, 0);
      
      semesterPlans.push({
        semester,
        items: semesterItems,
        total_credits: totalCredits
      });
    }

    // Sort by semester
    return semesterPlans.sort((a, b) => {
      // Simple sorting by semester string - could be improved with proper date parsing
      return a.semester.localeCompare(b.semester);
    });
  }
}

export class PlanItemModel {
  // Create a new plan item
  static async create(planId: string, itemData: CreatePlanItemRequest): Promise<PlanItem> {
    const query = `
      INSERT INTO plan_items (plan_id, course_code, semester, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [planId, itemData.course_code, itemData.semester, itemData.notes || null];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Find plan items by plan ID
  static async findByPlanId(planId: string): Promise<PlanItem[]> {
    const query = 'SELECT * FROM plan_items WHERE plan_id = $1 ORDER BY semester, course_code';
    const result = await pool.query(query, [planId]);
    return result.rows;
  }

  // Find plan item by ID
  static async findById(itemId: string): Promise<PlanItem | null> {
    const query = 'SELECT * FROM plan_items WHERE plan_item_id = $1';
    const result = await pool.query(query, [itemId]);
    return result.rows[0] || null;
  }

  // Update plan item
  static async update(itemId: string, updates: UpdatePlanItemRequest): Promise<PlanItem> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.semester !== undefined) {
      fields.push(`semester = $${paramCount++}`);
      values.push(updates.semester);
    }
    if (updates.notes !== undefined) {
      fields.push(`notes = $${paramCount++}`);
      values.push(updates.notes);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(itemId);
    const query = `
      UPDATE plan_items 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE plan_item_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete plan item
  static async delete(itemId: string): Promise<void> {
    const query = 'DELETE FROM plan_items WHERE plan_item_id = $1';
    await pool.query(query, [itemId]);
  }

  // Check if course is already in plan
  static async isCourseInPlan(planId: string, courseCode: string): Promise<boolean> {
    const query = 'SELECT 1 FROM plan_items WHERE plan_id = $1 AND course_code = $2 LIMIT 1';
    const result = await pool.query(query, [planId, courseCode]);
    return result.rows.length > 0;
  }

  // Check if course is already in a specific semester
  static async isCourseInSemester(planId: string, courseCode: string, semester: string): Promise<boolean> {
    const query = 'SELECT 1 FROM plan_items WHERE plan_id = $1 AND course_code = $2 AND semester = $3 LIMIT 1';
    const result = await pool.query(query, [planId, courseCode, semester]);
    return result.rows.length > 0;
  }
}
