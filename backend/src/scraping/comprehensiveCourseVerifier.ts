import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

interface RealCourse {
  code: string;
  title: string;
  description: string;
  credits: number;
  prerequisites: string[];
  termsOffered: string[];
}

class ComprehensiveCourseVerifier {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private realCourses: Map<string, RealCourse> = new Map();
  private departmentUrls: Map<string, string> = new Map();
  
  // All departments that might have courses at DePauw
  private departments = [
    'ANTH', 'ARTH', 'ASTR', 'BIOL', 'CHEM', 'CSC', 'COMM', 'ECON', 'EDUC', 'ENG', 
    'ENGL', 'ENVS', 'FREN', 'GEOL', 'GERM', 'HIST', 'JAPN', 'LATN', 'MATH', 'MUS', 
    'PHIL', 'PHYS', 'POLS', 'PSY', 'REL', 'SOC', 'SPAN', 'THEA', 'WLIT', 'WRIT',
    'ACCT', 'BUS', 'FIN', 'MGMT', 'MKT', 'STAT', 'DATA', 'INFO', 'CS', 'IT'
  ];

  async initialize() {
    console.log('🚀 Initializing Comprehensive Course Verifier...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
  }

  async buildDepartmentUrls() {
    console.log('🔍 Building department URL mappings...');
    
    // Map common department codes to their URL patterns
    const departmentMappings: { [key: string]: string } = {
      'ANTH': 'anthropology',
      'ARTH': 'art-history',
      'ASTR': 'astronomy',
      'BIOL': 'biology',
      'CHEM': 'chemistry',
      'CSC': 'computer-science',
      'CS': 'computer-science',
      'COMM': 'communication',
      'ECON': 'economics',
      'EDUC': 'education',
      'ENG': 'engineering',
      'ENGL': 'english',
      'ENVS': 'environmental-science',
      'FREN': 'french',
      'GEOL': 'geology',
      'GERM': 'german',
      'HIST': 'history',
      'JAPN': 'japanese',
      'LATN': 'latin',
      'MATH': 'mathematics',
      'MUS': 'music',
      'PHIL': 'philosophy',
      'PHYS': 'physics',
      'POLS': 'political-science',
      'PSY': 'psychology',
      'REL': 'religion',
      'SOC': 'sociology',
      'SPAN': 'spanish',
      'THEA': 'theatre',
      'WLIT': 'world-literature',
      'WRIT': 'writing',
      'ACCT': 'accounting',
      'BUS': 'business',
      'FIN': 'finance',
      'MGMT': 'management',
      'MKT': 'marketing',
      'STAT': 'statistics',
      'DATA': 'data-science',
      'INFO': 'informatics'
    };

    for (const [code, urlPart] of Object.entries(departmentMappings)) {
      this.departmentUrls.set(code, `https://www.depauw.edu/academics/majors-and-minors/about-${urlPart}/courses/`);
    }
  }

  async scrapeDepartmentCourses(department: string): Promise<RealCourse[]> {
    const url = this.departmentUrls.get(department);
    if (!url) {
      console.log(`⚠️  No URL mapping for department: ${department}`);
      return [];
    }

    try {
      console.log(`📚 Scraping courses for ${department} from: ${url}`);
      await this.page!.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      const courses = await this.page!.evaluate(() => {
        const courseElements: RealCourse[] = [];
        
        // Look for course listings in various possible structures
        const selectors = [
          'table tr',
          '.course-listing',
          '.course-item',
          '.course',
          '[class*="course"]',
          'li',
          'div[class*="course"]'
        ];

        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          
          for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const text = element.textContent || '';
            
            // Look for course code patterns (e.g., "CSC 121", "MATH 151")
            const courseCodeMatch = text.match(/\b([A-Z]{2,4})\s+(\d{3})\b/);
            if (courseCodeMatch) {
              const code = `${courseCodeMatch[1]} ${courseCodeMatch[2]}`;
              const title = text.split('\n')[0]?.trim() || '';
              
              // Extract additional info if available
              const creditsMatch = text.match(/(\d+)\s*credit/i);
              const credits = creditsMatch ? parseInt(creditsMatch[1]) : 1;
              
              const prerequisites: string[] = [];
              const prereqMatch = text.match(/prerequisite[s]?[:\s]+([^.]+)/i);
              if (prereqMatch) {
                prerequisites.push(prereqMatch[1].trim());
              }
              
              const termsMatch = text.match(/offered[:\s]+([^.]+)/i);
              const termsOffered = termsMatch ? [termsMatch[1].trim()] : ['Fall', 'Spring'];
              
              courseElements.push({
                code,
                title: title.replace(code, '').trim() || `${code} Course`,
                description: text.length > 200 ? text.substring(0, 200) + '...' : text,
                credits,
                prerequisites,
                termsOffered
              });
            }
          }
        }

        return courseElements;
      });

      console.log(`✅ Found ${courses.length} courses for ${department}`);
      return courses;

    } catch (error) {
      console.error(`❌ Error scraping ${department}:`, error);
      return [];
    }
  }

  async scrapeAllRealCourses() {
    console.log('🌐 Scraping all real courses from DePauw website...');
    
    await this.buildDepartmentUrls();
    
    for (const department of this.departments) {
      try {
        const courses = await this.scrapeDepartmentCourses(department);
        
        for (const course of courses) {
          this.realCourses.set(course.code, course);
        }
        
        // Add delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Failed to scrape ${department}:`, error);
      }
    }
    
    console.log(`🎯 Total real courses found: ${this.realCourses.size}`);
  }

  async loadCurrentCourses() {
    const coursesPath = path.join(__dirname, '../data/courses.json');
    
    if (!fs.existsSync(coursesPath)) {
      console.log('❌ courses.json not found');
      return [];
    }
    
    const coursesData = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
    return coursesData.courses || [];
  }

  async cleanCoursesData() {
    console.log('🧹 Cleaning courses data...');
    
    const currentCourses = await this.loadCurrentCourses();
    console.log(`📊 Current courses in database: ${currentCourses.length}`);
    
    const realCourseCodes = new Set(this.realCourses.keys());
    console.log(`✅ Real courses from website: ${realCourseCodes.size}`);
    
    // Filter out fake courses
    const cleanedCourses = currentCourses.filter((course: any) => {
      const isReal = realCourseCodes.has(course.code);
      if (!isReal) {
        console.log(`🗑️  Removing fake course: ${course.code}`);
      }
      return isReal;
    });
    
    console.log(`🧽 Cleaned courses: ${cleanedCourses.length} (removed ${currentCourses.length - cleanedCourses.length} fake courses)`);
    
    // Update courses.json
    const updatedCoursesData = {
      courses: cleanedCourses
    };
    
    const coursesPath = path.join(__dirname, '../data/courses.json');
    fs.writeFileSync(coursesPath, JSON.stringify(updatedCoursesData, null, 2));
    
    // Also update the dist folder
    const distCoursesPath = path.join(__dirname, '../../dist/data/courses.json');
    fs.writeFileSync(distCoursesPath, JSON.stringify(updatedCoursesData, null, 2));
    
    console.log('💾 Updated courses.json with cleaned data');
    
    return cleanedCourses;
  }

  async generateReport() {
    console.log('\n📋 VERIFICATION REPORT');
    console.log('====================');
    console.log(`Real courses found: ${this.realCourses.size}`);
    console.log(`Courses in database: ${(await this.loadCurrentCourses()).length}`);
    
    // Show some examples of real courses
    const realCourseList = Array.from(this.realCourses.values()).slice(0, 10);
    console.log('\n📚 Sample real courses:');
    realCourseList.forEach(course => {
      console.log(`  ${course.code}: ${course.title}`);
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.scrapeAllRealCourses();
      await this.cleanCoursesData();
      await this.generateReport();
    } catch (error) {
      console.error('❌ Error in course verification:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the verifier
const verifier = new ComprehensiveCourseVerifier();
verifier.run().then(() => {
  console.log('✅ Course verification complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Course verification failed:', error);
  process.exit(1);
});
