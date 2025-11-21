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

/**
 * Enhanced scraper to fetch course descriptions from DePauw /courses/ pages
 * Only updates descriptions, preserves all other data
 */
export class EnhancedDescriptionScraper {
  private browser: any;
  private page: any;
  private courseDescriptions: Map<string, string> = new Map();
  private scrapedUrls: Set<string> = new Set();

  async scrapeCourseDescriptions(): Promise<void> {
    console.log('🔍 Starting enhanced course description scraping...');
    
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
      
      console.log(`📚 Found ${coursesData.courses.length} existing courses`);
      
      // Scrape descriptions from program course pages
      await this.scrapeFromProgramCoursePages();
      
      // Update courses with descriptions
      await this.updateCoursesWithDescriptions(coursesData);
      
      console.log('✅ Enhanced course description scraping completed');
      
    } finally {
      await this.browser.close();
    }
  }

  /**
   * Scrape course descriptions from program /courses/ pages
   */
  private async scrapeFromProgramCoursePages(): Promise<void> {
    const programCourseUrls = [
      'https://www.depauw.edu/academics/majors-and-minors/about-computer-science/courses/',
      'https://www.depauw.edu/academics/majors-and-minors/about-mathematics/courses/',
      'https://www.depauw.edu/academics/majors-and-minors/about-biology/courses/',
      'https://www.depauw.edu/academics/majors-and-minors/about-chemistry/courses/',
      'https://www.depauw.edu/academics/majors-and-minors/about-economics/courses/',
      'https://www.depauw.edu/academics/majors-and-minors/about-english/courses/',
      'https://www.depauw.edu/academics/majors-and-minors/about-history/courses/',
      'https://www.depauw.edu/academics/majors-and-minors/about-psychology/courses/',
      'https://www.depauw.edu/academics/majors-and-minors/about-physics/courses/',
      'https://www.depauw.edu/academics/majors-and-minors/about-business-administration/courses/',
      'https://www.depauw.edu/academics/majors-and-minors/about-art-history/courses/',
      'https://www.depauw.edu/academics/majors-and-minors/about-astronomy/courses/',
      'https://www.depauw.edu/academics/majors-and-minors/about-communication/courses/',
      'https://www.depauw.edu/academics/majors-and-minors/about-geology/courses/',
      'https://www.depauw.edu/academics/majors-and-minors/about-political-science/courses/'
    ];

    for (const url of programCourseUrls) {
      if (this.scrapedUrls.has(url)) {
        console.log(`⏭️  Skipping already scraped: ${url}`);
        continue;
      }

      try {
        console.log(`🔍 Scraping course descriptions from: ${url}`);
        await this.scrapeProgramCoursePage(url);
        this.scrapedUrls.add(url);
        await new Promise(resolve => setTimeout(resolve, 3000)); // Be respectful to the server
      } catch (error) {
        console.error(`❌ Error scraping ${url}:`, error);
      }
    }
  }

  /**
   * Scrape a single program course page for detailed course information
   */
  private async scrapeProgramCoursePage(url: string): Promise<void> {
    try {
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      const courseData = await this.page.evaluate(() => {
        const courses: { [key: string]: { title: string; credits: number; description: string } } = {};
        
        // Look for course entries in various formats
        const courseElements = document.querySelectorAll('*');
        
        courseElements.forEach(element => {
          const text = element.textContent || '';
          
          // Look for course codes in the format "CSC 121", "MATH 151", etc.
          const courseCodeMatches = text.match(/\b([A-Z]{2,4}\s+\d{3})\b/g);
          
          if (courseCodeMatches) {
            courseCodeMatches.forEach(courseCode => {
              // Try to find the course title and description
              const parentElement = element.closest('div, p, li, article, .course, .course-item, [class*="course"]');
              if (parentElement) {
                const fullText = parentElement.textContent || '';
                const courseIndex = fullText.indexOf(courseCode);
                
                if (courseIndex !== -1) {
                  // Extract course title (usually after the course code)
                  const afterCode = fullText.substring(courseIndex + courseCode.length).trim();
                  const titleMatch = afterCode.match(/^[^.\n]+/);
                  const title = titleMatch ? titleMatch[0].trim() : '';
                  
                  // Extract description (look for longer text after title)
                  let description = '';
                  if (title) {
                    const titleIndex = afterCode.indexOf(title);
                    if (titleIndex !== -1) {
                      const afterTitle = afterCode.substring(titleIndex + title.length).trim();
                      // Look for description text (usually longer than 50 characters)
                      const descMatch = afterTitle.match(/^[^.\n]{50,500}/);
                      if (descMatch) {
                        description = descMatch[0].trim();
                      }
                    }
                  }
                  
                  // Clean up the description
                  description = description
                    .replace(/^\W+/, '') // Remove leading punctuation
                    .replace(/\s+/g, ' ') // Normalize whitespace
                    .replace(/\.\s*$/, '') // Remove trailing period
                    .substring(0, 500); // Limit length
                  
                  // Only keep if it looks like a real course with description
                  if (title && description && description.length > 30) {
                    courses[courseCode] = {
                      title: title,
                      credits: 1, // All courses are 1 credit
                      description: description
                    };
                  }
                }
              }
            });
          }
        });
        
        return courses;
      });
      
      // Store the course data
      Object.entries(courseData).forEach(([code, data]) => {
        if (!this.courseDescriptions.has(code)) { // Avoid duplication
          this.courseDescriptions.set(code, (data as any).description);
          console.log(`📝 Found: ${code} - ${(data as any).title.substring(0, 50)}...`);
        }
      });
      
      console.log(`📝 Found ${Object.keys(courseData).length} course descriptions on this page`);
      
    } catch (error) {
      console.error(`Error scraping program course page ${url}:`, error);
    }
  }

  /**
   * Update existing courses with scraped descriptions
   */
  private async updateCoursesWithDescriptions(coursesData: any): Promise<void> {
    console.log('📝 Updating courses with enhanced descriptions...');
    
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
    
    console.log(`✅ Updated ${updatedCount} courses with enhanced descriptions`);
    console.log(`📚 Total courses: ${coursesData.courses.length}`);
    console.log(`📝 Total descriptions found: ${this.courseDescriptions.size}`);
  }
}
