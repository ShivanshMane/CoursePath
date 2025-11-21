import express from 'express';
import fs from 'fs';
import path from 'path';
import { PlanModel, PlanItemModel } from '../models/planModel';
import { UserModel } from '../models/userModel';
import { CreatePlanRequest, UpdatePlanRequest, CreatePlanItemRequest, UpdatePlanItemRequest } from '../types/database';
import { PlanGenerationService } from '../services/planGenerationService';
import { PlanValidationService } from '../services/planValidationService';

const router = express.Router();

// Load courses data for services
const coursesPath = path.join(__dirname, '../data/courses.json');
const coursesData = JSON.parse(fs.readFileSync(coursesPath, 'utf-8'));

// Load programs data for requirements
const programsPath = path.join(__dirname, '../data/programs.json');
const programsData = JSON.parse(fs.readFileSync(programsPath, 'utf-8'));

// Initialize services
const planGenerationService = new PlanGenerationService(coursesData.courses);
const planValidationService = new PlanValidationService(coursesData.courses);

// Middleware to extract user ID from request (assuming it's set by auth middleware)
const getUserFromRequest = (req: express.Request): string => {
  // This would typically come from JWT token or session
  // For now, we'll use a simple header or query parameter
  const userId = req.headers['x-user-id'] as string || req.query.userId as string;
  if (!userId) {
    throw new Error('User ID is required');
  }
  return userId;
};

// Get user's plan
router.get('/', async (req, res) => {
  try {
    const userId = getUserFromRequest(req);
    
    // Verify user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const plan = await PlanModel.getPlanWithItems(userId);
    res.json(plan);
  } catch (error) {
    console.error('Error getting plan:', error);
    res.status(500).json({ error: 'Failed to get plan' });
  }
});

// Get semester-organized plan
router.get('/semester-view', async (req, res) => {
  try {
    const userId = getUserFromRequest(req);
    
    // Verify user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const semesterPlan = await PlanModel.getSemesterPlan(userId);
    res.json(semesterPlan);
  } catch (error) {
    console.error('Error getting semester plan:', error);
    res.status(500).json({ error: 'Failed to get semester plan' });
  }
});

// Create or get user's plan
router.post('/', async (req, res) => {
  try {
    const userId = getUserFromRequest(req);
    const planData: CreatePlanRequest = req.body;
    
    // Verify user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user already has a plan
    const existingPlan = await PlanModel.findByUserId(userId);
    if (existingPlan) {
      return res.json(existingPlan);
    }

    // Create new plan
    const plan = await PlanModel.create(userId, planData);
    res.status(201).json(plan);
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

// Update user's plan
router.put('/', async (req, res) => {
  try {
    const userId = getUserFromRequest(req);
    const updates: UpdatePlanRequest = req.body;
    
    // Verify user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get or create user's plan
    let plan = await PlanModel.findByUserId(userId);
    if (!plan) {
      // Create a new plan if it doesn't exist
      plan = await PlanModel.create(userId, updates);
      return res.json(plan);
    }

    // Update existing plan
    const updatedPlan = await PlanModel.update(plan.plan_id, updates);
    res.json(updatedPlan);
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// Add course to plan
router.post('/items', async (req, res) => {
  try {
    const userId = getUserFromRequest(req);
    const itemData: CreatePlanItemRequest = req.body;
    
    // Verify user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get or create user's plan
    let plan = await PlanModel.findByUserId(userId);
    if (!plan) {
      plan = await PlanModel.create(userId, {});
    }

    // Check if course is already in the same semester
    const isAlreadyAddedToSemester = await PlanItemModel.isCourseInSemester(plan.plan_id, itemData.course_code, itemData.semester);
    if (isAlreadyAddedToSemester) {
      return res.status(400).json({ error: 'Course already added to this semester' });
    }

    // Add course to plan
    const planItem = await PlanItemModel.create(plan.plan_id, itemData);
    res.status(201).json(planItem);
  } catch (error) {
    console.error('Error adding course to plan:', error);
    res.status(500).json({ error: 'Failed to add course to plan' });
  }
});

// Update plan item
router.put('/items/:itemId', async (req, res) => {
  try {
    const userId = getUserFromRequest(req);
    const { itemId } = req.params;
    const updates: UpdatePlanItemRequest = req.body;
    
    // Verify user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's plan
    const plan = await PlanModel.findByUserId(userId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Verify the item belongs to user's plan
    const item = await PlanItemModel.findById(itemId);
    if (!item || item.plan_id !== plan.plan_id) {
      return res.status(404).json({ error: 'Plan item not found' });
    }

    // Update plan item
    const updatedItem = await PlanItemModel.update(itemId, updates);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating plan item:', error);
    res.status(500).json({ error: 'Failed to update plan item' });
  }
});

// Remove course from plan
router.delete('/items/:itemId', async (req, res) => {
  try {
    const userId = getUserFromRequest(req);
    const { itemId } = req.params;
    
    // Verify user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's plan
    const plan = await PlanModel.findByUserId(userId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Verify the item belongs to user's plan
    const item = await PlanItemModel.findById(itemId);
    if (!item || item.plan_id !== plan.plan_id) {
      return res.status(404).json({ error: 'Plan item not found' });
    }

    // Delete plan item
    await PlanItemModel.delete(itemId);
    res.status(204).send();
  } catch (error) {
    console.error('Error removing course from plan:', error);
    res.status(500).json({ error: 'Failed to remove course from plan' });
  }
});

// Generate automatic plan
router.post('/generate', async (req, res) => {
  try {
    const userId = getUserFromRequest(req);
    const { program_id, preferences, credit_cap, credit_min } = req.body;
    
    // Verify user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find program requirements
    const allPrograms = [...(programsData.majors || []), ...(programsData.minors || [])];
    const program = allPrograms.find((p: any) => p.id === program_id);
    
    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    // Extract required courses from program requirements
    console.log(`🎓 Generating plan for: ${program.name}`);
    console.log(`📚 Total requirement groups: ${program.requirementGroups.length}`);
    
    const requiredCourses: string[] = [];
    program.requirementGroups.forEach((group: any, index: number) => {
      console.log(`  Group ${index + 1}: "${group.name}" (type: ${group.type}, courses: ${group.courses?.length || 0})`);
      
      // Extract from ALL groups, not just "all" type
      if (group.courses && Array.isArray(group.courses)) {
        requiredCourses.push(...group.courses);
      }
    });

    // Remove duplicates
    const uniqueCourses = Array.from(new Set(requiredCourses));
    console.log(`📊 Total unique courses required: ${uniqueCourses.length}`);
    console.log(`📋 First 10 courses:`, uniqueCourses.slice(0, 10));

    // Get existing plan items
    const existingPlan = await PlanModel.getPlanWithItems(userId);
    const existingItems = existingPlan?.items.map(item => ({
      course_code: item.course_code,
      semester: item.semester,
      credits: 0, // Will be populated by service
      is_locked: true // Treat existing courses as locked
    })) || [];

    // Generate plan
    const generatedPlan = planGenerationService.generatePlan({
      required_courses: uniqueCourses,
      existing_plan: existingItems,
      preferences: preferences || {},
      credit_cap: credit_cap || 16,
      credit_min: credit_min || 12,
      start_year: new Date().getFullYear()
    });

    res.json({
      success: true,
      data: generatedPlan,
      message: 'Plan generated successfully'
    });
  } catch (error) {
    console.error('Error generating plan:', error);
    res.status(500).json({ 
      error: 'Failed to generate plan',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Validate plan
router.post('/validate', async (req, res) => {
  try {
    const userId = getUserFromRequest(req);
    const { program_id, credit_cap } = req.body;
    
    // Verify user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's plan
    const plan = await PlanModel.findByUserId(userId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Get plan items
    const items = await PlanItemModel.findByPlanId(plan.plan_id);
    const planItems = items.map(item => ({
      course_code: item.course_code,
      semester: item.semester,
      plan_item_id: item.plan_item_id
    }));

    // Get program requirements if program_id provided
    let programRequirements = undefined;
    if (program_id) {
      const allPrograms = [...(programsData.majors || []), ...(programsData.minors || [])];
      const program = allPrograms.find((p: any) => p.id === program_id);
      if (program) {
        programRequirements = program.requirementGroups;
      }
    }

    // Get prior credits from preferences
    const priorCredits = plan.preferences?.prior_credits?.completed_courses || [];

    // Validate plan
    const validation = planValidationService.validatePlan(
      planItems,
      programRequirements,
      priorCredits,
      credit_cap || 16
    );

    res.json({
      success: true,
      data: validation,
      message: 'Plan validated successfully'
    });
  } catch (error) {
    console.error('Error validating plan:', error);
    res.status(500).json({ error: 'Failed to validate plan' });
  }
});

// Validate course addition
router.post('/validate-course', async (req, res) => {
  try {
    const userId = getUserFromRequest(req);
    const { course_code, semester, credit_cap } = req.body;
    
    // Verify user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's plan
    const plan = await PlanModel.findByUserId(userId);
    const items = plan ? await PlanItemModel.findByPlanId(plan.plan_id) : [];
    
    const planItems = items.map(item => ({
      course_code: item.course_code,
      semester: item.semester,
      plan_item_id: item.plan_item_id
    }));

    // Get prior credits from preferences
    const priorCredits = plan?.preferences?.prior_credits?.completed_courses || [];

    // Validate course addition
    const warnings = planValidationService.validateCourseAddition(
      course_code,
      semester,
      planItems,
      priorCredits,
      credit_cap || 16
    );

    res.json({
      success: true,
      data: {
        is_valid: warnings.filter(w => w.severity === 'error').length === 0,
        warnings
      },
      message: 'Course validated successfully'
    });
  } catch (error) {
    console.error('Error validating course:', error);
    res.status(500).json({ error: 'Failed to validate course' });
  }
});

export default router;
