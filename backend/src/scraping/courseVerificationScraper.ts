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
 * Scraper to verify courses against DePauw's official /courses/ pages
 * Removes fake/generated courses, keeps only real ones
 */
export class CourseVerificationScraper {
  private browser: any;
  private page: any;
  private realCourses: Map<string, { title: string; description: string }> = new Map();
  private scrapedUrls: Set<string> = new Set();

  async verifyAndCleanCourses(): Promise<void> {
    console.log('🔍 Starting course verification and cleanup...');
    
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
      
      // Scrape real courses from official /courses/ pages
      await this.scrapeRealCoursesFromOfficialPages();
      
      // Clean courses data - keep only real courses
      await this.cleanCoursesData(coursesData);
      
      console.log('✅ Course verification and cleanup completed');
      
    } finally {
      await this.browser.close();
    }
  }

  /**
   * Scrape real courses from official DePauw /courses/ pages
   */
  private async scrapeRealCoursesFromOfficialPages(): Promise<void> {
    const officialCourseUrls = [
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
      'https://www.depauw.edu/academics/majors-and-minors/about-political-science/courses/',
      'https://www.depauw.edu/academics/majors-and-minors/about-anthropology/courses/',
      'https://www.depauw.edu/academics/majors-and-minors/about-sociology/courses/',
      'https://www.depauw.edu/academics/majors-and-minors/about-philosophy/courses/',
      'https://www.depauw.edu/academics/majors-and-minors/about-religious-studies/courses/',
      'https://www.depauw.edu/academics/majors-and-minors/about-theatre/courses/'
    ];

    for (const url of officialCourseUrls) {
      if (this.scrapedUrls.has(url)) {
        console.log(`⏭️  Skipping already scraped: ${url}`);
        continue;
      }

      try {
        console.log(`🔍 Scraping real courses from: ${url}`);
        await this.scrapeOfficialCoursePage(url);
        this.scrapedUrls.add(url);
        await new Promise(resolve => setTimeout(resolve, 3000)); // Be respectful to the server
      } catch (error) {
        console.error(`❌ Error scraping ${url}:`, error);
      }
    }
  }

  /**
   * Scrape a single official course page for real courses
   */
  private async scrapeOfficialCoursePage(url: string): Promise<void> {
    try {
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      const realCourses = await this.page.evaluate(() => {
        const courses: { [key: string]: { title: string; description: string } } = {};
        
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
                      // Look for description text (usually longer than 30 characters)
                      const descMatch = afterTitle.match(/^[^.\n]{30,500}/);
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
                  
                  // Only keep if it looks like a real course
                  if (title && title.length > 5 && !title.includes('Course')) {
                    courses[courseCode] = {
                      title: title,
                      description: description || ''
                    };
                  }
                }
              }
            });
          }
        });
        
        return courses;
      });
      
      // Store the real courses
      Object.entries(realCourses).forEach(([code, data]) => {
        if (!this.realCourses.has(code)) { // Avoid duplication
          this.realCourses.set(code, data as { title: string; description: string });
          console.log(`✅ Found real course: ${code} - ${(data as any).title.substring(0, 50)}...`);
        }
      });
      
      console.log(`📝 Found ${Object.keys(realCourses).length} real courses on this page`);
      
    } catch (error) {
      console.error(`Error scraping official course page ${url}:`, error);
    }
  }

  /**
   * Clean courses data - keep only real courses that exist on official pages
   */
  private async cleanCoursesData(coursesData: any): Promise<void> {
    console.log('🧹 Cleaning courses data - removing fake courses...');
    
    const originalCount = coursesData.courses.length;
    
    // Filter to keep only real courses that exist on official pages
    coursesData.courses = coursesData.courses.filter((course: Course) => {
      const isRealCourse = this.realCourses.has(course.code);
      
      if (isRealCourse) {
        // Update with real title and description
        const realCourse = this.realCourses.get(course.code)!;
        course.title = realCourse.title;
        course.description = realCourse.description;
      }
      
      return isRealCourse;
    });
    
    // Remove duplicates by course code
    const uniqueCourses = new Map<string, Course>();
    coursesData.courses.forEach((course: Course) => {
      if (!uniqueCourses.has(course.code)) {
        uniqueCourses.set(course.code, course);
      }
    });
    
    coursesData.courses = Array.from(uniqueCourses.values());
    
    // Sort courses A-Z by code
    coursesData.courses.sort((a: Course, b: Course) => a.code.localeCompare(b.code));
    
    // Write cleaned courses data
    fs.writeFileSync(
      path.join(__dirname, '../data/courses.json'),
      JSON.stringify(coursesData, null, 2)
    );
    
    const removedCount = originalCount - coursesData.courses.length;
    console.log(`✅ Course cleanup completed`);
    console.log(`📚 Original courses: ${originalCount}`);
    console.log(`📚 Real courses kept: ${coursesData.courses.length}`);
    console.log(`🗑️  Fake courses removed: ${removedCount}`);
    console.log(`📝 Total real courses found: ${this.realCourses.size}`);
  }
}
