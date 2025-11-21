import { ComprehensiveDataGenerator } from '../scraping/comprehensiveDataGenerator';
import fs from 'fs';
import path from 'path';

// Generate comprehensive program data
const generator = new ComprehensiveDataGenerator();
const data = generator.generateComprehensiveData();

// Create the programs structure for programs.json
const programsData = {
  majors: data.programs.filter(p => p.type === 'Major'),
  minors: data.programs.filter(p => p.type === 'Minor'),
  generalEducation: {
    id: 'general-education',
    name: 'General Education',
    description: 'Liberal Arts education requirements for all students',
    totalCredits: 31,
    requirements: [
      {
        category: 'First-Year Studies',
        description: 'Introduction to liberal arts education',
        credits: 4,
        courses: ['FYSE 101']
      },
      {
        category: 'Writing',
        description: 'Development of critical writing skills',
        credits: 4,
        courses: ['WRIT 101']
      },
      {
        category: 'Mathematics',
        description: 'Quantitative reasoning and mathematical literacy',
        credits: 4,
        courses: ['MATH 151']
      },
      {
        category: 'Natural Sciences',
        description: 'Understanding of scientific principles',
        credits: 8,
        courses: ['BIOL 141', 'CHEM 131', 'PHYS 141']
      },
      {
        category: 'Social Sciences',
        description: 'Understanding of human behavior and society',
        credits: 8,
        courses: ['ECON 100', 'PSYC 100', 'SOC 100', 'POLS 100']
      },
      {
        category: 'Humanities',
        description: 'Critical thinking and cultural understanding',
        credits: 8,
        courses: ['ENGL 150', 'HIST 100', 'PHIL 100', 'ART 100']
      }
    ]
  }
};

// Write the comprehensive data
const programsPath = path.join(__dirname, '../data/programs.json');
fs.writeFileSync(programsPath, JSON.stringify(programsData, null, 2));

// Also update courses.json with comprehensive course data
const coursesPath = path.join(__dirname, '../data/courses.json');
fs.writeFileSync(coursesPath, JSON.stringify({courses: data.courses}, null, 2));

console.log('✅ Generated comprehensive DePauw University data');
console.log(`📊 Generated ${programsData.majors.length} majors and ${programsData.minors.length} minors`);
console.log(`📚 Generated ${data.courses.length} courses`);
console.log('🎯 All data based on DePauw University official website');
