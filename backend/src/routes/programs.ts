import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Load programs data
const programsPath = path.join(__dirname, '../data/programs.json');
const programsData = JSON.parse(fs.readFileSync(programsPath, 'utf-8'));

/**
 * GET /api/programs
 * Get all programs (majors, minors, and general education requirements)
 */
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: programsData,
      message: 'Programs retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve programs',
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/programs/majors
 * Get all majors
 */
router.get('/majors', (req, res) => {
  try {
    res.json({
      success: true,
      data: programsData.majors,
      message: 'Majors retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching majors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve majors',
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/programs/minors
 * Get all minors
 */
router.get('/minors', (req, res) => {
  try {
    res.json({
      success: true,
      data: programsData.minors,
      message: 'Minors retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching minors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve minors',
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/programs/general-education
 * Get general education requirements
 */
router.get('/general-education', (req, res) => {
  try {
    res.json({
      success: true,
      data: programsData.generalEducation,
      message: 'General education requirements retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching general education:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve general education requirements',
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/programs/:id
 * Get a specific program by ID
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Search in majors
    const major = programsData.majors.find((m: any) => m.id === id);
    if (major) {
      return res.json({
        success: true,
        data: major,
        message: 'Major retrieved successfully'
      });
    }
    
    // Search in minors
    const minor = programsData.minors.find((m: any) => m.id === id);
    if (minor) {
      return res.json({
        success: true,
        data: minor,
        message: 'Minor retrieved successfully'
      });
    }
    
    // Check if it's general education
    if (id === 'general-education') {
      return res.json({
        success: true,
        data: programsData.generalEducation,
        message: 'General education requirements retrieved successfully'
      });
    }
    
    // Not found
    res.status(404).json({
      success: false,
      error: 'Program not found',
      message: `No program found with ID: ${id}`
    });
  } catch (error) {
    console.error('Error fetching program:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve program',
      message: 'Internal server error'
    });
  }
});

export default router;
