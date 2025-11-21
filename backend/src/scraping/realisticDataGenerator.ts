import fs from 'fs';
import path from 'path';

interface Course {
  code: string;
  title: string;
  credits: number | null;
  description: string;
  prerequisites: string[];
  termOffered: string | null;
}

interface Program {
  id: string;
  name: string;
  type: string;
  totalCredits: number;
  requirementGroups: Array<{
    name: string;
    type: string;
    courses: string[];
  }>;
}

interface GeneratedData {
  programs: Program[];
  courses: Course[];
  lastUpdated: string;
}

/**
 * Generate realistic DePauw University data for demonstration purposes
 */
export class RealisticDataGenerator {
  
  /**
   * Generate comprehensive DePauw academic data
   */
  generateRealisticData(): GeneratedData {
    console.log('🎓 Generating realistic DePauw University data...');
    
    const courses = this.generateCourses();
    const programs = this.generatePrograms(courses);
    
    return {
      programs,
      courses,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Generate realistic courses across different departments
   */
  private generateCourses(): Course[] {
    const courses: Course[] = [
      // Computer Science
      {
        code: 'CSC 121',
        title: 'Computer Science I',
        credits: 4,
        description: 'Introduction to computer science and programming using Python. Topics include variables, control structures, functions, and basic data structures.',
        prerequisites: [],
        termOffered: 'Fall, Spring'
      },
      {
        code: 'CSC 232',
        title: 'Computer Science II',
        credits: 4,
        description: 'Advanced programming concepts including object-oriented programming, recursion, and algorithm analysis using Java.',
        prerequisites: ['CSC 121'],
        termOffered: 'Fall, Spring'
      },
      {
        code: 'CSC 340',
        title: 'Data Structures and Algorithms',
        credits: 4,
        description: 'Study of fundamental data structures including lists, stacks, queues, trees, and graphs. Algorithm design and analysis.',
        prerequisites: ['CSC 232'],
        termOffered: 'Fall'
      },
      {
        code: 'CSC 380',
        title: 'Software Engineering',
        credits: 4,
        description: 'Software development lifecycle, project management, testing, and team-based software development.',
        prerequisites: ['CSC 340'],
        termOffered: 'Spring'
      },
      {
        code: 'CSC 490',
        title: 'Senior Capstone',
        credits: 4,
        description: 'Comprehensive software development project integrating multiple computer science concepts.',
        prerequisites: ['CSC 380'],
        termOffered: 'Fall, Spring'
      },

      // Mathematics
      {
        code: 'MATH 151',
        title: 'Calculus I',
        credits: 4,
        description: 'Limits, continuity, derivatives, and applications of derivatives.',
        prerequisites: [],
        termOffered: 'Fall, Spring'
      },
      {
        code: 'MATH 152',
        title: 'Calculus II',
        credits: 4,
        description: 'Integration techniques, applications of integration, and infinite series.',
        prerequisites: ['MATH 151'],
        termOffered: 'Fall, Spring'
      },
      {
        code: 'MATH 253',
        title: 'Calculus III',
        credits: 4,
        description: 'Multivariable calculus, partial derivatives, and multiple integrals.',
        prerequisites: ['MATH 152'],
        termOffered: 'Fall'
      },
      {
        code: 'MATH 270',
        title: 'Linear Algebra',
        credits: 4,
        description: 'Vector spaces, linear transformations, eigenvalues, and eigenvectors.',
        prerequisites: ['MATH 152'],
        termOffered: 'Spring'
      },
      {
        code: 'MATH 310',
        title: 'Abstract Algebra',
        credits: 4,
        description: 'Groups, rings, and fields with applications to number theory.',
        prerequisites: ['MATH 270'],
        termOffered: 'Fall'
      },

      // Biology
      {
        code: 'BIOL 141',
        title: 'Principles of Biology',
        credits: 4,
        description: 'Introduction to biological principles including cell structure, genetics, and evolution.',
        prerequisites: [],
        termOffered: 'Fall, Spring'
      },
      {
        code: 'BIOL 142',
        title: 'Organismal Biology',
        credits: 4,
        description: 'Survey of plant and animal diversity, anatomy, and physiology.',
        prerequisites: ['BIOL 141'],
        termOffered: 'Fall, Spring'
      },
      {
        code: 'BIOL 250',
        title: 'Genetics',
        credits: 4,
        description: 'Principles of heredity, molecular genetics, and population genetics.',
        prerequisites: ['BIOL 142'],
        termOffered: 'Fall'
      },
      {
        code: 'BIOL 340',
        title: 'Cell Biology',
        credits: 4,
        description: 'Structure and function of cells, cellular processes, and molecular biology.',
        prerequisites: ['BIOL 250'],
        termOffered: 'Spring'
      },

      // Chemistry
      {
        code: 'CHEM 131',
        title: 'General Chemistry I',
        credits: 4,
        description: 'Atomic structure, chemical bonding, stoichiometry, and thermochemistry.',
        prerequisites: [],
        termOffered: 'Fall, Spring'
      },
      {
        code: 'CHEM 132',
        title: 'General Chemistry II',
        credits: 4,
        description: 'Chemical equilibrium, kinetics, and introduction to organic chemistry.',
        prerequisites: ['CHEM 131'],
        termOffered: 'Fall, Spring'
      },
      {
        code: 'CHEM 231',
        title: 'Organic Chemistry I',
        credits: 4,
        description: 'Structure, bonding, and reactions of organic compounds.',
        prerequisites: ['CHEM 132'],
        termOffered: 'Fall'
      },
      {
        code: 'CHEM 232',
        title: 'Organic Chemistry II',
        credits: 4,
        description: 'Advanced organic reactions, spectroscopy, and synthesis.',
        prerequisites: ['CHEM 231'],
        termOffered: 'Spring'
      },

      // Psychology
      {
        code: 'PSYC 100',
        title: 'Introduction to Psychology',
        credits: 4,
        description: 'Survey of psychological principles including cognition, development, and social behavior.',
        prerequisites: [],
        termOffered: 'Fall, Spring'
      },
      {
        code: 'PSYC 200',
        title: 'Research Methods',
        credits: 4,
        description: 'Experimental design, statistical analysis, and research ethics in psychology.',
        prerequisites: ['PSYC 100'],
        termOffered: 'Fall, Spring'
      },
      {
        code: 'PSYC 310',
        title: 'Cognitive Psychology',
        credits: 4,
        description: 'Study of mental processes including perception, memory, and problem-solving.',
        prerequisites: ['PSYC 200'],
        termOffered: 'Fall'
      },

      // English
      {
        code: 'ENGL 150',
        title: 'Introduction to Literature',
        credits: 4,
        description: 'Critical analysis of poetry, fiction, and drama from various time periods.',
        prerequisites: [],
        termOffered: 'Fall, Spring'
      },
      {
        code: 'ENGL 250',
        title: 'American Literature',
        credits: 4,
        description: 'Survey of American literature from colonial period to present.',
        prerequisites: ['ENGL 150'],
        termOffered: 'Fall'
      },
      {
        code: 'ENGL 350',
        title: 'Shakespeare',
        credits: 4,
        description: 'Critical study of selected plays and sonnets by William Shakespeare.',
        prerequisites: ['ENGL 250'],
        termOffered: 'Spring'
      },

      // History
      {
        code: 'HIST 100',
        title: 'World History to 1500',
        credits: 4,
        description: 'Survey of world civilizations from ancient times to 1500.',
        prerequisites: [],
        termOffered: 'Fall'
      },
      {
        code: 'HIST 101',
        title: 'World History since 1500',
        credits: 4,
        description: 'Survey of world civilizations from 1500 to present.',
        prerequisites: [],
        termOffered: 'Spring'
      },
      {
        code: 'HIST 200',
        title: 'American History to 1877',
        credits: 4,
        description: 'Survey of American history from colonial period through Reconstruction.',
        prerequisites: ['HIST 100', 'HIST 101'],
        termOffered: 'Fall'
      },

      // Economics
      {
        code: 'ECON 100',
        title: 'Principles of Economics',
        credits: 4,
        description: 'Introduction to microeconomic and macroeconomic principles.',
        prerequisites: [],
        termOffered: 'Fall, Spring'
      },
      {
        code: 'ECON 200',
        title: 'Microeconomics',
        credits: 4,
        description: 'Theory of consumer and producer behavior, market structures, and efficiency.',
        prerequisites: ['ECON 100'],
        termOffered: 'Fall'
      },
      {
        code: 'ECON 201',
        title: 'Macroeconomics',
        credits: 4,
        description: 'National income, inflation, unemployment, and monetary and fiscal policy.',
        prerequisites: ['ECON 100'],
        termOffered: 'Spring'
      },

      // Physics
      {
        code: 'PHYS 141',
        title: 'General Physics I',
        credits: 4,
        description: 'Mechanics, waves, and thermodynamics with calculus.',
        prerequisites: ['MATH 151'],
        termOffered: 'Fall'
      },
      {
        code: 'PHYS 142',
        title: 'General Physics II',
        credits: 4,
        description: 'Electricity, magnetism, and optics with calculus.',
        prerequisites: ['PHYS 141', 'MATH 152'],
        termOffered: 'Spring'
      },

      // General Education
      {
        code: 'FYSE 101',
        title: 'First-Year Seminar',
        credits: 4,
        description: 'Interdisciplinary seminar designed to develop critical thinking and writing skills.',
        prerequisites: [],
        termOffered: 'Fall'
      },
      {
        code: 'WRIT 101',
        title: 'Composition',
        credits: 4,
        description: 'Development of writing skills with emphasis on argumentation and research.',
        prerequisites: [],
        termOffered: 'Fall, Spring'
      }
    ];

    console.log(`📚 Generated ${courses.length} courses`);
    return courses;
  }

  /**
   * Generate realistic academic programs
   */
  private generatePrograms(courses: Course[]): Program[] {
    const programs: Program[] = [
      {
        id: 'computer-science-major',
        name: 'Computer Science Major',
        type: 'Major',
        totalCredits: 40,
        requirementGroups: [
          {
            name: 'Core Courses',
            type: 'all',
            courses: ['CSC 121', 'CSC 232', 'CSC 340', 'CSC 380', 'CSC 490']
          },
          {
            name: 'Mathematics Requirements',
            type: 'all',
            courses: ['MATH 151', 'MATH 152', 'MATH 270']
          },
          {
            name: 'Electives',
            type: 'any',
            courses: ['CSC 340', 'CSC 380', 'CSC 490']
          }
        ]
      },
      {
        id: 'mathematics-major',
        name: 'Mathematics Major',
        type: 'Major',
        totalCredits: 36,
        requirementGroups: [
          {
            name: 'Core Courses',
            type: 'all',
            courses: ['MATH 151', 'MATH 152', 'MATH 253', 'MATH 270', 'MATH 310']
          },
          {
            name: 'Advanced Electives',
            type: 'any',
            courses: ['MATH 310']
          }
        ]
      },
      {
        id: 'biology-major',
        name: 'Biology Major',
        type: 'Major',
        totalCredits: 44,
        requirementGroups: [
          {
            name: 'Core Courses',
            type: 'all',
            courses: ['BIOL 141', 'BIOL 142', 'BIOL 250', 'BIOL 340']
          },
          {
            name: 'Chemistry Requirements',
            type: 'all',
            courses: ['CHEM 131', 'CHEM 132']
          },
          {
            name: 'Mathematics Requirements',
            type: 'all',
            courses: ['MATH 151', 'MATH 152']
          }
        ]
      },
      {
        id: 'chemistry-major',
        name: 'Chemistry Major',
        type: 'Major',
        totalCredits: 48,
        requirementGroups: [
          {
            name: 'Core Courses',
            type: 'all',
            courses: ['CHEM 131', 'CHEM 132', 'CHEM 231', 'CHEM 232']
          },
          {
            name: 'Mathematics Requirements',
            type: 'all',
            courses: ['MATH 151', 'MATH 152', 'MATH 253']
          },
          {
            name: 'Physics Requirements',
            type: 'all',
            courses: ['PHYS 141', 'PHYS 142']
          }
        ]
      },
      {
        id: 'psychology-major',
        name: 'Psychology Major',
        type: 'Major',
        totalCredits: 32,
        requirementGroups: [
          {
            name: 'Core Courses',
            type: 'all',
            courses: ['PSYC 100', 'PSYC 200', 'PSYC 310']
          },
          {
            name: 'Electives',
            type: 'any',
            courses: ['PSYC 100', 'PSYC 200', 'PSYC 310']
          }
        ]
      },
      {
        id: 'english-major',
        name: 'English Major',
        type: 'Major',
        totalCredits: 36,
        requirementGroups: [
          {
            name: 'Core Courses',
            type: 'all',
            courses: ['ENGL 150', 'ENGL 250', 'ENGL 350']
          },
          {
            name: 'Electives',
            type: 'any',
            courses: ['ENGL 150', 'ENGL 250', 'ENGL 350']
          }
        ]
      },
      {
        id: 'history-major',
        name: 'History Major',
        type: 'Major',
        totalCredits: 32,
        requirementGroups: [
          {
            name: 'Core Courses',
            type: 'all',
            courses: ['HIST 100', 'HIST 101', 'HIST 200']
          },
          {
            name: 'Electives',
            type: 'any',
            courses: ['HIST 100', 'HIST 101', 'HIST 200']
          }
        ]
      },
      {
        id: 'economics-major',
        name: 'Economics Major',
        type: 'Major',
        totalCredits: 32,
        requirementGroups: [
          {
            name: 'Core Courses',
            type: 'all',
            courses: ['ECON 100', 'ECON 200', 'ECON 201']
          },
          {
            name: 'Mathematics Requirements',
            type: 'all',
            courses: ['MATH 151', 'MATH 152']
          }
        ]
      },
      {
        id: 'physics-major',
        name: 'Physics Major',
        type: 'Major',
        totalCredits: 40,
        requirementGroups: [
          {
            name: 'Core Courses',
            type: 'all',
            courses: ['PHYS 141', 'PHYS 142']
          },
          {
            name: 'Mathematics Requirements',
            type: 'all',
            courses: ['MATH 151', 'MATH 152', 'MATH 253', 'MATH 270']
          }
        ]
      },
      // Minors
      {
        id: 'computer-science-minor',
        name: 'Computer Science Minor',
        type: 'Minor',
        totalCredits: 20,
        requirementGroups: [
          {
            name: 'Required Courses',
            type: 'all',
            courses: ['CSC 121', 'CSC 232', 'CSC 340']
          },
          {
            name: 'Electives',
            type: 'any',
            courses: ['CSC 380', 'CSC 490']
          }
        ]
      },
      {
        id: 'mathematics-minor',
        name: 'Mathematics Minor',
        type: 'Minor',
        totalCredits: 20,
        requirementGroups: [
          {
            name: 'Required Courses',
            type: 'all',
            courses: ['MATH 151', 'MATH 152', 'MATH 270']
          },
          {
            name: 'Electives',
            type: 'any',
            courses: ['MATH 253', 'MATH 310']
          }
        ]
      },
      {
        id: 'psychology-minor',
        name: 'Psychology Minor',
        type: 'Minor',
        totalCredits: 20,
        requirementGroups: [
          {
            name: 'Required Courses',
            type: 'all',
            courses: ['PSYC 100', 'PSYC 200']
          },
          {
            name: 'Electives',
            type: 'any',
            courses: ['PSYC 310']
          }
        ]
      },
      {
        id: 'english-minor',
        name: 'English Minor',
        type: 'Minor',
        totalCredits: 20,
        requirementGroups: [
          {
            name: 'Required Courses',
            type: 'all',
            courses: ['ENGL 150', 'ENGL 250']
          },
          {
            name: 'Electives',
            type: 'any',
            courses: ['ENGL 350']
          }
        ]
      }
    ];

    console.log(`📋 Generated ${programs.length} programs`);
    return programs;
  }

  /**
   * Save generated data to JSON files
   */
  async saveToFiles(data: GeneratedData): Promise<void> {
    const dataDir = path.join(__dirname, '../data');
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Save programs
    const programsPath = path.join(dataDir, 'programs.json');
    const programsData = {
      majors: data.programs.filter(p => p.type === 'Major'),
      minors: data.programs.filter(p => p.type === 'Minor'),
      generalEducation: this.getDefaultGenEd()
    };
    fs.writeFileSync(programsPath, JSON.stringify(programsData, null, 2));
    console.log(`💾 Saved ${data.programs.length} programs to ${programsPath}`);

    // Save courses
    const coursesPath = path.join(dataDir, 'courses.json');
    const coursesData = {
      courses: data.courses
    };
    fs.writeFileSync(coursesPath, JSON.stringify(coursesData, null, 2));
    console.log(`💾 Saved ${data.courses.length} courses to ${coursesPath}`);

    // Save combined data with timestamp
    const combinedPath = path.join(dataDir, 'scraped-data.json');
    fs.writeFileSync(combinedPath, JSON.stringify(data, null, 2));
    console.log(`💾 Saved combined data with timestamp to ${combinedPath}`);
  }

  /**
   * Get default general education structure
   */
  private getDefaultGenEd() {
    return {
      id: "general-education",
      name: "General Education Requirements",
      type: "general",
      description: "Core curriculum requirements for all DePauw students.",
      totalCredits: 48,
      requirements: [
        {
          category: "First-Year Seminar",
          credits: 4,
          description: "Required first-year experience course",
          courses: ["FYSE 101"]
        },
        {
          category: "Writing",
          credits: 4,
          description: "Composition and rhetoric course",
          courses: ["WRIT 101"]
        },
        {
          category: "Quantitative Reasoning",
          credits: 4,
          description: "Mathematics or statistics course",
          courses: ["MATH 151", "MATH 152"]
        },
        {
          category: "Natural Science",
          credits: 8,
          description: "Two courses in natural sciences",
          courses: ["BIOL 141", "CHEM 131", "PHYS 141"]
        },
        {
          category: "Social Science",
          credits: 8,
          description: "Two courses in social sciences",
          courses: ["ECON 100", "PSYC 100", "HIST 100"]
        },
        {
          category: "Arts and Humanities",
          credits: 8,
          description: "Two courses in arts and humanities",
          courses: ["ENGL 150", "ENGL 250"]
        },
        {
          category: "Global Perspectives",
          credits: 4,
          description: "Course with international focus",
          courses: ["HIST 100", "HIST 101"]
        },
        {
          category: "Values and Ethics",
          credits: 4,
          description: "Course exploring ethical reasoning",
          courses: ["PHIL 100", "REL 100"]
        }
      ]
    };
  }
}

export default RealisticDataGenerator;
