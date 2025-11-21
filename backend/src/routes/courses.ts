import express from 'express';
import fs from 'fs';
import path from 'path';

// Helper function to get last updated timestamp
function getLastUpdated(): string | null {
  try {
    const combinedPath = path.join(__dirname, '../data/scraped-data.json');
    if (fs.existsSync(combinedPath)) {
      const data = JSON.parse(fs.readFileSync(combinedPath, 'utf-8'));
      return data.lastUpdated || null;
    }
    return null;
  } catch (error) {
    return null;
  }
}

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

    // Filter by department (course code prefix)
    if (department) {
      filteredCourses = filteredCourses.filter((course: any) => 
        course.code.startsWith(department.toString())
      );
    }

    // Filter by level (first digit of course number)
    if (level) {
      filteredCourses = filteredCourses.filter((course: any) => {
        const courseNumber = course.code.split(' ')[1];
        return courseNumber && courseNumber.startsWith(level.toString());
      });
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
      lastUpdated: getLastUpdated(),
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
    
    // Department field doesn't exist in current data structure
    // Return empty array for now
    const departmentCourses: any[] = [];
    
    res.json({
      success: true,
      data: departmentCourses,
      message: `Department filtering not available in current data structure`
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
