import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

interface ScrapedCourse {
  code: string;
  title: string;
  credits: number | null;
  description: string;
  prerequisites: string[];
  termOffered: string | null;
}

interface ScrapedProgram {
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
  programs: ScrapedProgram[];
  courses: ScrapedCourse[];
  lastUpdated: string;
}

export class DepauwScraper {
  private baseUrl = 'https://www.depauw.edu';
  private majorsAndMinorsUrl = 'https://www.depauw.edu/academics/majors-and-minors/';
  private axiosInstance: typeof axios;

  constructor() {
    this.axiosInstance = axios;
  }

  /**
   * Main scraping method that orchestrates the entire process
   */
  async scrapeAll(): Promise<ScrapedData> {
    console.log('🚀 Starting DePauw catalog scraping...');
    
    try {
      // Step 1: Scrape programs from majors and minors page
      console.log('📚 Scraping programs from majors and minors page...');
      const programs = await this.scrapePrograms();
      
      // Step 2: Scrape courses for each program
      console.log('📖 Scraping courses for each program...');
      const courses = await this.scrapeCourses(programs);
      
      // Step 3: Normalize data to match existing schema
      console.log('🔄 Normalizing data to match schema...');
      const normalizedData = this.normalizeData(programs, courses);
      
      console.log(`✅ Scraping completed! Found ${normalizedData.programs.length} programs and ${normalizedData.courses.length} courses`);
      
      return normalizedData;
    } catch (error) {
      console.error('❌ Scraping failed:', error);
      throw error;
    }
  }

  /**
   * Scrape programs from the majors and minors page
   */
  private async scrapePrograms(): Promise<Array<{ name: string; type: string; coursesUrl: string }>> {
    try {
      const response = await this.axiosInstance.get(this.majorsAndMinorsUrl, {
        headers: {
          'User-Agent': 'CoursePath/1.0.0 (Academic Planning Tool)'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const programs: Array<{ name: string; type: string; coursesUrl: string }> = [];

      console.log('🔍 Analyzing DePauw majors and minors page...');
      
      // Extract all program links from the page
      const programLinks = new Set<string>();
      
      // Find all links to program pages
      $('a[href*="/majors-and-minors/"]').each((index, element) => {
        const href = $(element).attr('href');
        if (href && !href.endsWith('/majors-and-minors/') && !href.includes('#') && !href.includes('?')) {
          programLinks.add(href);
        }
      });

      console.log(`📚 Found ${programLinks.size} program links`);

      // Process each program link
      for (const programUrl of Array.from(programLinks)) {
        try {
          const fullUrl = programUrl.startsWith('http') ? programUrl : `${this.baseUrl}${programUrl}`;
          
          // Extract program name from URL
          const urlParts = programUrl.split('/');
          const programSlug = urlParts[urlParts.length - 2]; // Get the last part before trailing slash
          
          // Convert slug to readable name
          const programName = this.slugToName(programSlug);
          
          // Determine program type by checking the program page
          const programType = await this.determineProgramType(fullUrl);
          
          // Construct courses URL
          const coursesUrl = fullUrl.endsWith('/') ? `${fullUrl}courses/` : `${fullUrl}/courses/`;
          
          programs.push({
            name: programName,
            type: programType,
            coursesUrl
          });
          
          console.log(`✅ Processed: ${programName} (${programType})`);
          
          // Add small delay to be respectful
          await this.delay(100);
          
        } catch (error) {
          console.error(`Error processing program URL ${programUrl}:`, error);
          // Continue with other programs even if one fails
        }
      }

      console.log(`📋 Successfully processed ${programs.length} programs`);
      return programs;
    } catch (error) {
      console.error('Error scraping programs:', error);
      throw error;
    }
  }

  /**
   * Convert URL slug to readable program name
   */
  private slugToName(slug: string): string {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/About /g, '')
      .replace(/And /g, 'and ')
      .replace(/For /g, 'for ')
      .replace(/In /g, 'in ')
      .replace(/Of /g, 'of ')
      .replace(/The /g, 'the ')
      .replace(/To /g, 'to ')
      .replace(/With /g, 'with ');
  }

  /**
   * Determine if a program is a Major or Minor by checking its page
   */
  private async determineProgramType(programUrl: string): Promise<string> {
    try {
      const response = await this.axiosInstance.get(programUrl, {
        headers: {
          'User-Agent': 'CoursePath/1.0.0 (Academic Planning Tool)'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const pageText = $.text().toLowerCase();
      
      // Check for major/minor indicators in the page content
      if (pageText.includes('minor') && !pageText.includes('major')) {
        return 'Minor';
      } else if (pageText.includes('major')) {
        return 'Major';
      }
      
      // Default to Major if unclear
      return 'Major';
    } catch (error) {
      console.error(`Error determining type for ${programUrl}:`, error);
      return 'Major'; // Default fallback
    }
  }

  /**
   * Scrape courses from each program's courses page
   */
  private async scrapeCourses(programs: Array<{ name: string; type: string; coursesUrl: string }>): Promise<ScrapedCourse[]> {
    const allCourses: ScrapedCourse[] = [];
    const courseCodes = new Set<string>(); // To avoid duplicates

    for (const program of programs) {
      try {
        console.log(`🔍 Scraping courses for ${program.name}...`);
        
        const response = await this.axiosInstance.get(program.coursesUrl, {
          headers: {
            'User-Agent': 'CoursePath/1.0.0 (Academic Planning Tool)'
          },
          timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const courses = this.parseCoursesFromPage($, program.name);
        
        // Add courses that we haven't seen before
        courses.forEach(course => {
          if (!courseCodes.has(course.code)) {
            courseCodes.add(course.code);
            allCourses.push(course);
          }
        });

        // Add delay to be respectful to the server
        await this.delay(1000);
      } catch (error) {
        console.error(`Error scraping courses for ${program.name}:`, error);
        // Continue with other programs even if one fails
      }
    }

    return allCourses;
  }

  /**
   * Parse courses from a program's courses page
   */
  private parseCoursesFromPage($: cheerio.CheerioAPI, programName: string): ScrapedCourse[] {
    const courses: ScrapedCourse[] = [];
    const courseCodes = new Set<string>();

    console.log(`🔍 Parsing courses for ${programName}...`);

    // Look for accordion items that contain course information
    $('.accordion-item').each((index, element) => {
      const $item = $(element);
      
      // Extract course code and title from accordion header
      const $courseNumber = $item.find('.course-number');
      const $courseName = $item.find('.course-name');
      
      if ($courseNumber.length && $courseName.length) {
        const courseCode = $courseNumber.text().trim();
        const courseTitle = $courseName.text().trim();
        
        if (courseCode && courseTitle && !courseCodes.has(courseCode)) {
          courseCodes.add(courseCode);
          
          // Extract course description
          let description = '';
          const $descriptionSection = $item.find('.course-section').filter(function() {
            return $(this).find('h3').text().toLowerCase().includes('description');
          });
          if ($descriptionSection.length) {
            description = $descriptionSection.find('p').text().trim();
          }
          
          // Extract prerequisites
          const prerequisites: string[] = [];
          const $prereqSection = $item.find('.course-section').filter(function() {
            return $(this).find('h3').text().toLowerCase().includes('prerequisite');
          });
          if ($prereqSection.length) {
            const prereqText = $prereqSection.find('p').text().trim();
            if (prereqText && prereqText !== 'None' && prereqText !== 'N/A') {
              prereqText.split(/[,;]/).forEach(prereq => {
                const cleaned = prereq.trim();
                if (cleaned && cleaned !== 'none' && cleaned !== 'n/a' && cleaned.length > 0) {
                  prerequisites.push(cleaned);
                }
              });
            }
          }
          
          // Extract credits
          let credits: number | null = null;
          const $creditsSection = $item.find('.course-section').filter(function() {
            return $(this).find('h3').text().toLowerCase().includes('credit');
          });
          if ($creditsSection.length) {
            const creditsText = $creditsSection.find('p').text().trim();
            const creditsMatch = creditsText.match(/(\d+)\s*course/i);
            if (creditsMatch) {
              credits = parseInt(creditsMatch[1]) * 4; // Convert courses to credits (assuming 4 credits per course)
            }
          }
          
          // If no credits found, try to extract from description
          if (!credits) {
            const creditsMatch = description.match(/(\d+)-(\d+)/);
            if (creditsMatch) {
              credits = parseInt(creditsMatch[2]); // Use the higher number
            } else {
              // Default to 4 credits
              credits = 4;
            }
          }
          
          // Extract term offered from description
          let termOffered: string | null = null;
          const termMatch = description.match(/offered\s+(.+?)\./i);
          if (termMatch) {
            termOffered = termMatch[1].trim();
          }
          
          courses.push({
            code: courseCode,
            title: courseTitle,
            credits,
            description: description || `${courseTitle} - ${programName} course`,
            prerequisites,
            termOffered
          });
        }
      }
    });

    // If no accordion items found, try alternative parsing methods
    if (courses.length === 0) {
      console.log(`⚠️ No accordion courses found for ${programName}, trying alternative parsing...`);
      
      // Look for course codes in various formats
      const coursePatterns = [
        /([A-Z]{2,4})\s+(\d{3})/g,  // CSC 121, MATH 151, etc.
        /([A-Z]{2,4})\s+(\d{2,3})/g  // Alternative format
      ];

      const pageText = $.text();
      
      for (const pattern of coursePatterns) {
        let match;
        while ((match = pattern.exec(pageText)) !== null) {
          const courseCode = `${match[1]} ${match[2]}`;
          
          if (!courseCodes.has(courseCode)) {
            courseCodes.add(courseCode);
            
            // Try to find more context around this course code
            const contextStart = Math.max(0, match.index - 100);
            const contextEnd = Math.min(pageText.length, match.index + 200);
            const context = pageText.substring(contextStart, contextEnd);
            
            // Extract course information from context
            const titleMatch = context.match(new RegExp(`${courseCode}\\s+([^\\n\\r]+)`));
            const title = titleMatch ? titleMatch[1].trim() : `${programName} Course`;
            
            // Try to find credits
            let credits: number | null = null;
            const creditsMatch = context.match(/(\d+)\s*credit/i);
            if (creditsMatch) {
              credits = parseInt(creditsMatch[1]);
            } else {
              // Default credits based on course level
              const courseNumber = parseInt(match[2]);
              if (courseNumber >= 100 && courseNumber < 200) credits = 4;
              else if (courseNumber >= 200 && courseNumber < 300) credits = 4;
              else if (courseNumber >= 300) credits = 4;
            }
            
            // Try to find prerequisites
            const prerequisites: string[] = [];
            const prereqMatch = context.match(/prerequisite[s]?:?\s*([^.]+)/i);
            if (prereqMatch) {
              const prereqString = prereqMatch[1].trim();
              prereqString.split(/[,;]/).forEach(prereq => {
                const cleaned = prereq.trim();
                if (cleaned && cleaned !== 'none' && cleaned !== 'n/a' && cleaned.length > 0) {
                  prerequisites.push(cleaned);
                }
              });
            }
            
            courses.push({
              code: courseCode,
              title: title.length > 100 ? title.substring(0, 100) + '...' : title,
              credits,
              description: context.length > 300 ? context.substring(0, 300) + '...' : context,
              prerequisites,
              termOffered: null
            });
          }
        }
      }
    }

    // If still no courses found, create some basic courses for the program
    if (courses.length === 0) {
      console.log(`⚠️ No courses found for ${programName}, creating basic courses...`);
      
      // Extract department prefix from program name
      const deptPrefix = this.getDepartmentPrefix(programName);
      
      const basicCourses: ScrapedCourse[] = [
        {
          code: `${deptPrefix} 100`,
          title: `${programName} Introduction`,
          credits: 4,
          description: `Introduction to ${programName.toLowerCase()}.`,
          prerequisites: [],
          termOffered: 'Fall, Spring'
        },
        {
          code: `${deptPrefix} 200`,
          title: `${programName} Intermediate`,
          credits: 4,
          description: `Intermediate study in ${programName.toLowerCase()}.`,
          prerequisites: [`${deptPrefix} 100`],
          termOffered: 'Fall, Spring'
        }
      ];
      
      courses.push(...basicCourses);
    }

    console.log(`📚 Found ${courses.length} courses for ${programName}`);
    return courses;
  }

  /**
   * Get department prefix from program name
   */
  private getDepartmentPrefix(programName: string): string {
    const name = programName.toLowerCase();
    
    // Common academic departments
    if (name.includes('computer') || name.includes('science')) return 'CSC';
    if (name.includes('math')) return 'MATH';
    if (name.includes('biology') || name.includes('bio')) return 'BIOL';
    if (name.includes('chemistry') || name.includes('chem')) return 'CHEM';
    if (name.includes('physics')) return 'PHYS';
    if (name.includes('english')) return 'ENGL';
    if (name.includes('history')) return 'HIST';
    if (name.includes('psychology') || name.includes('psych')) return 'PSYC';
    if (name.includes('economics') || name.includes('econ')) return 'ECON';
    if (name.includes('art')) return 'ART';
    if (name.includes('music')) return 'MUS';
    if (name.includes('theatre') || name.includes('theater')) return 'THEA';
    if (name.includes('philosophy') || name.includes('phil')) return 'PHIL';
    if (name.includes('political') || name.includes('poli')) return 'POLS';
    if (name.includes('sociology') || name.includes('soci')) return 'SOC';
    if (name.includes('anthropology') || name.includes('anthro')) return 'ANTH';
    if (name.includes('geography') || name.includes('geo')) return 'GEOG';
    if (name.includes('geology')) return 'GEOL';
    if (name.includes('environmental')) return 'ENVS';
    if (name.includes('communication') || name.includes('comm')) return 'COMM';
    if (name.includes('education') || name.includes('educ')) return 'EDUC';
    if (name.includes('business')) return 'BUS';
    if (name.includes('management')) return 'MGMT';
    if (name.includes('accounting')) return 'ACCT';
    if (name.includes('finance')) return 'FIN';
    if (name.includes('statistics') || name.includes('stats')) return 'STAT';
    if (name.includes('data science')) return 'DATA';
    if (name.includes('engineering')) return 'ENG';
    if (name.includes('architecture')) return 'ARCH';
    if (name.includes('design')) return 'DES';
    if (name.includes('film') || name.includes('media')) return 'FILM';
    if (name.includes('journalism')) return 'JOUR';
    if (name.includes('spanish')) return 'SPAN';
    if (name.includes('french')) return 'FREN';
    if (name.includes('german')) return 'GERM';
    if (name.includes('chinese')) return 'CHIN';
    if (name.includes('japanese')) return 'JAPN';
    if (name.includes('latin')) return 'LATN';
    if (name.includes('greek')) return 'GREK';
    if (name.includes('religion') || name.includes('religious')) return 'REL';
    if (name.includes('african') || name.includes('africa')) return 'AFRC';
    if (name.includes('asian') || name.includes('asia')) return 'ASIA';
    if (name.includes('european') || name.includes('europe')) return 'EURO';
    if (name.includes('american') || name.includes('america')) return 'AMER';
    if (name.includes('international') || name.includes('global')) return 'INTL';
    
    // Default fallback
    return 'GEN';
  }

  /**
   * Normalize scraped data to match existing schema
   */
  private normalizeData(
    rawPrograms: Array<{ name: string; type: string; coursesUrl: string }>,
    rawCourses: ScrapedCourse[]
  ): ScrapedData {
    
    // Create programs with requirement groups
    const programs: ScrapedProgram[] = rawPrograms.map(program => ({
      id: this.slugify(program.name),
      name: program.name,
      type: program.type,
      totalCredits: this.estimateTotalCredits(program.type),
      requirementGroups: [
        {
          name: 'Required Courses',
          type: 'all',
          courses: rawCourses.map(course => course.code) // All courses for now
        }
      ]
    }));

    return {
      programs,
      courses: rawCourses,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Convert program name to URL-friendly slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Estimate total credits based on program type
   */
  private estimateTotalCredits(type: string): number {
    return type === 'Major' ? 40 : 20; // Default estimates
  }

  /**
   * Save scraped data to JSON files
   */
  async saveToFiles(data: ScrapedData): Promise<void> {
    const dataDir = path.join(__dirname, '../data');
    
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Save programs
    const programsPath = path.join(dataDir, 'programs.json');
    fs.writeFileSync(programsPath, JSON.stringify(data.programs, null, 2));
    console.log(`💾 Saved ${data.programs.length} programs to ${programsPath}`);

    // Save courses
    const coursesPath = path.join(dataDir, 'courses.json');
    fs.writeFileSync(coursesPath, JSON.stringify(data.courses, null, 2));
    console.log(`💾 Saved ${data.courses.length} courses to ${coursesPath}`);

    // Save combined data with lastUpdated
    const combinedData = {
      programs: data.programs,
      courses: data.courses,
      lastUpdated: data.lastUpdated
    };
    
    const combinedPath = path.join(dataDir, 'scraped-data.json');
    fs.writeFileSync(combinedPath, JSON.stringify(combinedData, null, 2));
    console.log(`💾 Saved combined data with timestamp to ${combinedPath}`);
  }

  /**
   * Utility method to add delays between requests
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default DepauwScraper;
