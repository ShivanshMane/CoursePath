import pool from '../config/database';
import { testConnection } from '../config/database';
import fs from 'fs';
import path from 'path';

interface Program {
  id: string;
  name: string;
  type: 'Major' | 'Minor';
  totalCredits: number;
  requirementGroups: Array<{
    name: string;
    type: string;
    courses: string[];
  }>;
}

interface Course {
  code: string;
  title: string;
  credits: number;
  description?: string;
  prerequisites?: string[];
  termOffered?: string;
}

async function populateDatabase() {
  try {
    console.log('🔄 Starting database population...');
    
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Read scraped data
    const programsPath = path.join(__dirname, '../data/programs.json');
    const coursesPath = path.join(__dirname, '../data/courses.json');

    if (!fs.existsSync(programsPath)) {
      throw new Error(`Programs file not found: ${programsPath}`);
    }
    if (!fs.existsSync(coursesPath)) {
      throw new Error(`Courses file not found: ${coursesPath}`);
    }

    const programsFile = JSON.parse(fs.readFileSync(programsPath, 'utf8'));
    const coursesFile = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));

    // Extract programs from majors and minors arrays
    const programsData: Program[] = [
      ...(programsFile.majors || []),
      ...(programsFile.minors || []),
      ...(programsFile.generalEducation ? [programsFile.generalEducation] : [])
    ];
    
    // Extract courses from courses array
    const coursesData: Course[] = coursesFile.courses || [];

    console.log(`📚 Found ${programsData.length} programs and ${coursesData.length} courses`);

    // Clear existing data (optional - remove if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    await pool.query('DELETE FROM plan_items');
    await pool.query('DELETE FROM plans');
    await pool.query('DELETE FROM users');
    await pool.query('DELETE FROM courses');
    await pool.query('DELETE FROM programs');

    // Insert programs
    console.log('📋 Inserting programs...');
    for (const program of programsData) {
      const query = `
        INSERT INTO programs (name, type, requirements)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
      `;
      await pool.query(query, [
        program.name, 
        program.type ? program.type.toLowerCase() : 'general', // Convert 'Major' to 'major', 'Minor' to 'minor', or default to 'general'
        JSON.stringify({
          totalCredits: program.totalCredits,
          requirementGroups: program.requirementGroups
        })
      ]);
    }

    // Insert courses
    console.log('📖 Inserting courses...');
    for (const course of coursesData) {
      const query = `
        INSERT INTO courses (course_code, title, credits, description, prereqs, terms_offered)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (course_code) DO NOTHING
      `;
      await pool.query(query, [
        course.code,
        course.title,
        course.credits,
        course.description || null,
        course.prerequisites || null,
        course.termOffered ? [course.termOffered] : null
      ]);
    }

    // Verify data insertion
    const programCount = await pool.query('SELECT COUNT(*) FROM programs');
    const courseCount = await pool.query('SELECT COUNT(*) FROM courses');

    console.log('✅ Database population completed!');
    console.log(`📊 Programs inserted: ${programCount.rows[0].count}`);
    console.log(`📊 Courses inserted: ${courseCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error populating database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  populateDatabase();
}

export default populateDatabase;
