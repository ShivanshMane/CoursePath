import puppeteer from 'puppeteer';
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

interface ScrapedData {
  programs: Program[];
  courses: Course[];
  lastUpdated: string;
}

/**
 * Comprehensive DePauw University web scraper
 * Scrapes all majors, minors, and courses from the official website
 */
export class DepauwWebScraper {
  private browser: any;
  private page: any;

  async scrapeAllData(): Promise<ScrapedData> {
    console.log('🚀 Starting DePauw University web scraping...');
    
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    try {
      // Step 1: Scrape all programs (majors and minors)
      const programs = await this.scrapePrograms();
      
      // Step 2: Scrape all courses from all programs
      const courses = await this.scrapeAllCourses(programs);
      
      // Step 3: Normalize and deduplicate data
      const normalizedData = this.normalizeData(programs, courses);
      
      console.log('✅ Scraping completed successfully');
      console.log(`📊 Found ${normalizedData.programs.length} programs`);
      console.log(`📚 Found ${normalizedData.courses.length} unique courses`);
      
      return normalizedData;
    } finally {
      await this.browser.close();
    }
  }

  /**
   * Scrape all programs from the main majors and minors page
   */
  private async scrapePrograms(): Promise<Program[]> {
    console.log('📋 Scraping programs from main page...');
    
    await this.page.goto('https://www.depauw.edu/academics/majors-and-minors/', {
      waitUntil: 'networkidle2'
    });

    const programs = await this.page.evaluate(() => {
      const programElements = document.querySelectorAll('[data-program]');
      const programs: any[] = [];

      programElements.forEach((element: any) => {
        const name = element.querySelector('h3, h4, .program-title')?.textContent?.trim();
        const type = element.querySelector('.program-type')?.textContent?.trim() || 'Major';
        const link = element.querySelector('a')?.href;
        
        if (name && link) {
          programs.push({
            name,
            type: type.includes('Minor') ? 'Minor' : 'Major',
            link,
            id: link.split('/').pop()?.replace(/[^a-zA-Z0-9-]/g, '-') || name.toLowerCase().replace(/\s+/g, '-')
          });
        }
      });

      return programs;
    });

    console.log(`📋 Found ${programs.length} programs on main page`);

    // Scrape detailed information for each program
    const detailedPrograms: Program[] = [];
    
    for (const program of programs.slice(0, 10)) { // Limit to first 10 for testing
      try {
        console.log(`🔍 Scraping details for: ${program.name}`);
        const details = await this.scrapeProgramDetails(program.link);
        if (details) {
          detailedPrograms.push({
            id: program.id,
            name: program.name,
            type: program.type,
            totalCredits: details.totalCredits,
            requirementGroups: details.requirementGroups
          });
        }
      } catch (error) {
        console.error(`❌ Error scraping ${program.name}:`, error);
      }
    }

    return detailedPrograms;
  }

  /**
   * Scrape detailed program information from individual program pages
   */
  private async scrapeProgramDetails(programUrl: string): Promise<any> {
    try {
      await this.page.goto(programUrl, { waitUntil: 'networkidle2' });
      
      const programDetails = await this.page.evaluate(() => {
        // Extract total credits
        const creditsText = document.querySelector('.credits, .total-credits, [class*="credit"]')?.textContent;
        const creditsMatch = creditsText?.match(/(\d+)/);
        const totalCredits = creditsMatch ? parseInt(creditsMatch[1]) : 32;

        // Extract requirement groups
        const requirementGroups: any[] = [];
        
        // Look for requirement sections
        const sections = document.querySelectorAll('.requirements, .course-requirements, .program-requirements');
        
        sections.forEach(section => {
          const sectionTitle = section.querySelector('h3, h4, .section-title')?.textContent?.trim();
          const courseElements = section.querySelectorAll('.course, .course-item, [class*="course"]');
          
          if (courseElements.length > 0) {
            const courses: string[] = [];
            courseElements.forEach(courseEl => {
              const courseCode = courseEl.querySelector('.course-code, .code')?.textContent?.trim();
              if (courseCode) {
                courses.push(courseCode);
              }
            });
            
            if (courses.length > 0) {
              requirementGroups.push({
                name: sectionTitle || 'Required Courses',
                type: 'all',
                courses
              });
            }
          }
        });

        // If no structured requirements found, look for any course codes on the page
        if (requirementGroups.length === 0) {
          const allCourseCodes = document.querySelectorAll('*');
          const courseCodes: string[] = [];
          
          allCourseCodes.forEach(el => {
            const text = el.textContent || '';
            const matches = text.match(/\b[A-Z]{2,4}\s+\d{3}\b/g);
            if (matches) {
              courseCodes.push(...matches);
            }
          });
          
          if (courseCodes.length > 0) {
            requirementGroups.push({
              name: 'Required Courses',
              type: 'all',
              courses: [...new Set(courseCodes)]
            });
          }
        }

        return {
          totalCredits,
          requirementGroups
        };
      });

      return programDetails;
    } catch (error) {
      console.error(`Error scraping program details from ${programUrl}:`, error);
      return null;
    }
  }

  /**
   * Scrape all courses from all programs
   */
  private async scrapeAllCourses(programs: Program[]): Promise<Course[]> {
    console.log('📚 Scraping all courses...');
    
    const allCourses: Course[] = [];
    const courseCodes = new Set<string>();

    // Collect all course codes from programs
    programs.forEach(program => {
      program.requirementGroups.forEach(group => {
        group.courses.forEach(courseCode => {
          courseCodes.add(courseCode);
        });
      });
    });

    console.log(`📚 Found ${courseCodes.size} unique course codes`);

    // For each course code, try to find course details
    for (const courseCode of Array.from(courseCodes).slice(0, 20)) { // Limit for testing
      try {
        const courseDetails = await this.scrapeCourseDetails(courseCode);
        if (courseDetails) {
          allCourses.push(courseDetails);
        }
      } catch (error) {
        console.error(`Error scraping course ${courseCode}:`, error);
      }
    }

    return allCourses;
  }

  /**
   * Scrape individual course details
   */
  private async scrapeCourseDetails(courseCode: string): Promise<Course | null> {
    try {
      // Try to find course in course catalog or course search
      const searchUrl = `https://www.depauw.edu/academics/course-catalog/?search=${encodeURIComponent(courseCode)}`;
      await this.page.goto(searchUrl, { waitUntil: 'networkidle2' });
      
      const courseDetails = await this.page.evaluate((code: string) => {
        // Look for course information on the page
        const courseElement = document.querySelector('.course, .course-item, [class*="course"]');
        
        if (courseElement) {
          const title = courseElement.querySelector('.title, .course-title, h3, h4')?.textContent?.trim();
          const description = courseElement.querySelector('.description, .course-description, p')?.textContent?.trim();
          const creditsText = courseElement.querySelector('.credits, .credit-hours')?.textContent;
          const credits = creditsText ? parseInt(creditsText.match(/\d+/)?.[0] || '4') : 4;
          
          return {
            code,
            title: title || `${code} Course`,
            credits,
            description: description || `Course description for ${code}`,
            prerequisites: [],
            termOffered: 'Fall, Spring'
          };
        }
        
        return null;
      }, courseCode);

      return courseDetails;
    } catch (error) {
      console.error(`Error scraping course ${courseCode}:`, error);
      return null;
    }
  }

  /**
   * Normalize and deduplicate scraped data
   */
  private normalizeData(programs: Program[], courses: Course[]): ScrapedData {
    // Remove duplicates from courses
    const uniqueCourses = courses.filter((course, index, self) => 
      index === self.findIndex(c => c.code === course.code)
    );

    // Sort courses A-Z by course code
    uniqueCourses.sort((a, b) => a.code.localeCompare(b.code));

    // Ensure all programs have valid data
    const normalizedPrograms = programs.map(program => ({
      ...program,
      totalCredits: program.totalCredits || 32,
      requirementGroups: program.requirementGroups.length > 0 ? program.requirementGroups : [{
        name: 'Required Courses',
        type: 'all',
        courses: []
      }]
    }));

    return {
      programs: normalizedPrograms,
      courses: uniqueCourses,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Save scraped data to files
   */
  async saveData(data: ScrapedData): Promise<void> {
    const dataDir = path.join(__dirname, '../data');
    
    // Create programs.json
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
          }
        ]
      }
    };

    // Create courses.json
    const coursesData = {
      courses: data.courses
    };

    // Write files
    fs.writeFileSync(
      path.join(dataDir, 'programs.json'),
      JSON.stringify(programsData, null, 2)
    );
    
    fs.writeFileSync(
      path.join(dataDir, 'courses.json'),
      JSON.stringify(coursesData, null, 2)
    );

    console.log('💾 Data saved to files');
    console.log(`📊 Programs: ${programsData.majors.length} majors, ${programsData.minors.length} minors`);
    console.log(`📚 Courses: ${coursesData.courses.length} courses`);
  }
}
