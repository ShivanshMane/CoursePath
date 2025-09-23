import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Load courses data
const coursesPath = path.join(__dirname, '../data/courses.json');
const coursesData = JSON.parse(fs.readFileSync(coursesPath, 'utf-8'));

/**
 * GET /api/courses
 * Get all courses with optional filtering
 */
router.get('/', (req, res) => {
  try {
    const { 
      department, 
      level, 
      term, 
      genEd, 
      search,
      limit = '50',
      offset = '0'
    } = req.query;

    let filteredCourses = [...coursesData.courses];

    // Filter by department
    if (department) {
      filteredCourses = filteredCourses.filter((course: any) => 
        course.department.toLowerCase().includes(department.toString().toLowerCase())
      );
    }

    // Filter by level
    if (level) {
      filteredCourses = filteredCourses.filter((course: any) => 
        course.level === level.toString()
      );
    }

    // Filter by typical term
    if (term) {
      filteredCourses = filteredCourses.filter((course: any) => 
        course.typicalTerms.includes(term.toString())
      );
    }

    // Filter by general education category
    if (genEd) {
      filteredCourses = filteredCourses.filter((course: any) => 
        course.genEdCategories.includes(genEd.toString())
      );
    }

    // Search in title, code, or description
    if (search) {
      const searchTerm = search.toString().toLowerCase();
      filteredCourses = filteredCourses.filter((course: any) => 
        course.title.toLowerCase().includes(searchTerm) ||
        course.code.toLowerCase().includes(searchTerm) ||
        course.description.toLowerCase().includes(searchTerm)
      );
    }

    // Apply pagination
    const limitNum = parseInt(limit.toString());
    const offsetNum = parseInt(offset.toString());
    const paginatedCourses = filteredCourses.slice(offsetNum, offsetNum + limitNum);

    res.json({
      success: true,
      data: {
        courses: paginatedCourses,
        total: filteredCourses.length,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < filteredCourses.length
      },
      message: 'Courses retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve courses',
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/courses/:code
 * Get a specific course by code
 */
router.get('/:code', (req, res) => {
  try {
    const { code } = req.params;
    
    const course = coursesData.courses.find((c: any) => 
      c.code.toLowerCase() === code.toLowerCase()
    );
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
        message: `No course found with code: ${code}`
      });
    }
    
    res.json({
      success: true,
      data: course,
      message: 'Course retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve course',
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/courses/department/:department
 * Get all courses in a specific department
 */
router.get('/department/:department', (req, res) => {
  try {
    const { department } = req.params;
    
    const departmentCourses = coursesData.courses.filter((course: any) => 
      course.department.toLowerCase() === department.toLowerCase()
    );
    
    res.json({
      success: true,
      data: departmentCourses,
      message: `Courses in ${department} department retrieved successfully`
    });
  } catch (error) {
    console.error('Error fetching department courses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve department courses',
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/courses/prerequisites/:code
 * Get all courses that have the specified course as a prerequisite
 */
router.get('/prerequisites/:code', (req, res) => {
  try {
    const { code } = req.params;
    
    const dependentCourses = coursesData.courses.filter((course: any) => 
      course.prerequisites.some((prereq: string) => 
        prereq.toLowerCase() === code.toLowerCase()
      )
    );
    
    res.json({
      success: true,
      data: dependentCourses,
      message: `Courses with ${code} as prerequisite retrieved successfully`
    });
  } catch (error) {
    console.error('Error fetching prerequisite courses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve prerequisite courses',
      message: 'Internal server error'
    });
  }
});

export default router;
