import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

interface Course {
  code: string;
  title: string;
  credits: number;
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

/**
 * Scraper to fetch course descriptions from DePauw program pages
 * Only updates descriptions, keeps all other data intact
 */
export class CourseDescriptionScraper {
  private browser: any;
  private page: any;
  private courseDescriptions: Map<string, string> = new Map();

  async scrapeCourseDescriptions(): Promise<void> {
    console.log('🔍 Starting course description scraping...');
    
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    try {
      // Load existing courses data
      const coursesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/courses.json'), 'utf8'));
      const programsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/programs.json'), 'utf8'));
      
      console.log(`📚 Found ${coursesData.courses.length} existing courses`);
      console.log(`📋 Found ${programsData.majors.length} majors and ${programsData.minors.length} minors`);
      
      // Scrape descriptions from program pages
      await this.scrapeFromProgramPages(programsData);
      
      // Update courses with descriptions
      await this.updateCoursesWithDescriptions(coursesData);
      
      console.log('✅ Course description scraping completed');
      
    } finally {
      await this.browser.close();
    }
  }

  /**
   * Scrape course descriptions from program requirement pages
   */
  private async scrapeFromProgramPages(programsData: any): Promise<void> {
    const programUrls = [
      'https://www.depauw.edu/academics/majors-and-minors/about-computer-science/requirements/',
      'https://www.depauw.edu/academics/majors-and-minors/about-mathematics/requirements/',
      'https://www.depauw.edu/academics/majors-and-minors/about-biology/requirements/',
      'https://www.depauw.edu/academics/majors-and-minors/about-chemistry/requirements/',
      'https://www.depauw.edu/academics/majors-and-minors/about-economics/requirements/',
      'https://www.depauw.edu/academics/majors-and-minors/about-english/requirements/',
      'https://www.depauw.edu/academics/majors-and-minors/about-history/requirements/',
      'https://www.depauw.edu/academics/majors-and-minors/about-psychology/requirements/',
      'https://www.depauw.edu/academics/majors-and-minors/about-physics/requirements/',
      'https://www.depauw.edu/academics/majors-and-minors/about-business-administration/requirements/'
    ];

    for (const url of programUrls) {
      try {
        console.log(`🔍 Scraping descriptions from: ${url}`);
        await this.scrapeProgramPage(url);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Be respectful to the server
      } catch (error) {
        console.error(`❌ Error scraping ${url}:`, error);
      }
    }
  }

  /**
   * Scrape a single program page for course descriptions
   */
  private async scrapeProgramPage(url: string): Promise<void> {
    try {
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      const courseDescriptions = await this.page.evaluate(() => {
        const descriptions: { [key: string]: string } = {};
        
        // Look for course information in various formats
        const courseElements = document.querySelectorAll('*');
        
        courseElements.forEach(element => {
          const text = element.textContent || '';
          
          // Look for course codes in the format "CSC 121", "MATH 151", etc.
          const courseCodeMatches = text.match(/\b([A-Z]{2,4}\s+\d{3})\b/g);
          
          if (courseCodeMatches) {
            courseCodeMatches.forEach(courseCode => {
              // Try to find description near the course code
              const parentElement = element.closest('p, div, li, td, th, .course, .course-item, [class*="course"]');
              if (parentElement) {
                const fullText = parentElement.textContent || '';
                const courseIndex = fullText.indexOf(courseCode);
                
                if (courseIndex !== -1) {
                  // Extract text after the course code as potential description
                  const afterCode = fullText.substring(courseIndex + courseCode.length).trim();
                  
                  // Clean up the description
                  let description = afterCode
                    .replace(/^\W+/, '') // Remove leading punctuation
                    .replace(/\s+/g, ' ') // Normalize whitespace
                    .substring(0, 200); // Limit length
                  
                  // Only keep if it looks like a real description
                  if (description.length > 20 && 
                      !description.includes('Prerequisite') && 
                      !description.includes('Credit') &&
                      !description.includes('Fall') &&
                      !description.includes('Spring')) {
                    descriptions[courseCode] = description;
                  }
                }
              }
            });
          }
        });
        
        return descriptions;
      });
      
      // Store the descriptions
      Object.entries(courseDescriptions).forEach(([code, description]) => {
        this.courseDescriptions.set(code, description as string);
      });
      
      console.log(`📝 Found ${Object.keys(courseDescriptions).length} course descriptions on this page`);
      
    } catch (error) {
      console.error(`Error scraping program page ${url}:`, error);
    }
  }

  /**
   * Update existing courses with scraped descriptions
   */
  private async updateCoursesWithDescriptions(coursesData: any): Promise<void> {
    console.log('📝 Updating courses with descriptions...');
    
    let updatedCount = 0;
    
    coursesData.courses = coursesData.courses.map((course: Course) => {
      const description = this.courseDescriptions.get(course.code) || '';
      
      if (description) {
        updatedCount++;
      }
      
      return {
        ...course,
        description: description || course.description || '' // Keep existing description if no new one found
      };
    });
    
    // Write updated courses data
    fs.writeFileSync(
      path.join(__dirname, '../data/courses.json'),
      JSON.stringify(coursesData, null, 2)
    );
    
    console.log(`✅ Updated ${updatedCount} courses with new descriptions`);
    console.log(`📚 Total courses: ${coursesData.courses.length}`);
  }
}
