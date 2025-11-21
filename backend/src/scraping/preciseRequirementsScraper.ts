import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

interface RequirementGroup {
  name: string;
  type: 'all' | 'choose';
  courses: string[];
  chooseCount?: number;
  description?: string;
}

interface Program {
  id: string;
  name: string;
  type: 'Major' | 'Minor';
  totalCredits: number;
  requirementGroups: RequirementGroup[];
}

class PreciseRequirementsScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private programs: Program[] = [];
  
  // Specific URL mappings for each major
  private majorUrls: { [key: string]: string } = {
    'computer-science-major': 'https://www.depauw.edu/academics/majors-and-minors/about-computer-science/requirements/',
    'anthropology-major': 'https://www.depauw.edu/academics/majors-and-minors/about-anthropology/requirements/',
    'biology-major': 'https://www.depauw.edu/academics/majors-and-minors/about-biology/requirements/',
    'chemistry-major': 'https://www.depauw.edu/academics/majors-and-minors/about-chemistry/requirements/',
    'mathematics-major': 'https://www.depauw.edu/academics/majors-and-minors/about-mathematics/requirements/',
    'physics-major': 'https://www.depauw.edu/academics/majors-and-minors/about-physics/requirements/',
    'psychology-major': 'https://www.depauw.edu/academics/majors-and-minors/about-psychology/requirements/',
    'economics-major': 'https://www.depauw.edu/academics/majors-and-minors/about-economics/requirements/',
    'history-major': 'https://www.depauw.edu/academics/majors-and-minors/about-history/requirements/',
    'political-science-major': 'https://www.depauw.edu/academics/majors-and-minors/about-political-science/requirements/',
    'sociology-major': 'https://www.depauw.edu/academics/majors-and-minors/about-sociology/requirements/',
    'philosophy-major': 'https://www.depauw.edu/academics/majors-and-minors/about-philosophy/requirements/',
    'english-literature-major': 'https://www.depauw.edu/academics/majors-and-minors/about-english-literature/requirements/',
    'communication-major': 'https://www.depauw.edu/academics/majors-and-minors/about-communication/requirements/',
    'art-history-major': 'https://www.depauw.edu/academics/majors-and-minors/about-art-history/requirements/',
    'music-major': 'https://www.depauw.edu/academics/majors-and-minors/about-music/requirements/',
    'theatre-major': 'https://www.depauw.edu/academics/majors-and-minors/about-theatre/requirements/',
    'neuroscience-major': 'https://www.depauw.edu/academics/majors-and-minors/about-neuroscience/requirements/',
    'biochemistry-major': 'https://www.depauw.edu/academics/majors-and-minors/about-biochemistry/requirements/',
    'astronomy-major': 'https://www.depauw.edu/academics/majors-and-minors/about-astronomy/requirements/',
    'geology-major': 'https://www.depauw.edu/academics/majors-and-minors/about-geology/requirements/',
    'environmental-geoscience-major': 'https://www.depauw.edu/academics/majors-and-minors/about-environmental-geoscience/requirements/',
    'data-science-major': 'https://www.depauw.edu/academics/majors-and-minors/about-data-science/requirements/',
    'applied-statistics-major': 'https://www.depauw.edu/academics/majors-and-minors/about-applied-statistics/requirements/',
    'creative-writing-major': 'https://www.depauw.edu/academics/majors-and-minors/about-creative-writing/requirements/',
    'africana-studies-major': 'https://www.depauw.edu/academics/majors-and-minors/about-africana-studies/requirements/',
    'asian-studies-major': 'https://www.depauw.edu/academics/majors-and-minors/about-asian-studies/requirements/',
    'german-major': 'https://www.depauw.edu/academics/majors-and-minors/about-german/requirements/',
    'romance-languages-major': 'https://www.depauw.edu/academics/majors-and-minors/about-romance-languages/requirements/',
    'kinesiology-major': 'https://www.depauw.edu/academics/majors-and-minors/about-kinesiology/requirements/'
  };

  async initialize() {
    console.log('🚀 Initializing Precise Requirements Scraper...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
  }

  async scrapeMajorRequirements(majorId: string, majorName: string): Promise<Program | null> {
    const url = this.majorUrls[majorId];
    if (!url) {
      console.log(`⚠️  No URL mapping for major: ${majorId}`);
      return null;
    }

    try {
      console.log(`📚 Scraping requirements for ${majorName} from: ${url}`);
      await this.page!.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      const programData = await this.page!.evaluate(() => {
        const requirementGroups: RequirementGroup[] = [];
        
        // Look specifically for requirement sections
        const requirementSelectors = [
          'h2:contains("Requirements")',
          'h3:contains("Requirements")',
          'h3:contains("Required")',
          'h3:contains("Core")',
          'h3:contains("Foundation")',
          '.requirements',
          '.course-requirements',
          '[class*="requirement"]'
        ];

        // Try to find the main content area
        const contentSelectors = [
          'main',
          '.content',
          '.page-content',
          '#content',
          '.requirements-content'
        ];

        let contentElement = null;
        for (const selector of contentSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            contentElement = element;
            break;
          }
        }

        if (!contentElement) {
          contentElement = document.body;
        }

        // Look for requirement sections
        const sections = contentElement.querySelectorAll('h2, h3, h4, .requirement-section, .course-requirements');
        
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          const sectionText = section.textContent?.toLowerCase() || '';
          
          // Check if this is a requirement section
          if (sectionText.includes('requirement') || 
              sectionText.includes('core') || 
              sectionText.includes('foundation') ||
              sectionText.includes('required') ||
              sectionText.includes('major')) {
            
            const sectionName = section.textContent?.trim() || 'Requirements';
            
            // Look for courses in this section
            const courses: string[] = [];
            
            // Check the next few elements for course codes
            let nextElement = section.nextElementSibling;
            let depth = 0;
            
            while (nextElement && depth < 10) {
              const elementText = nextElement.textContent || '';
              
              // Look for course codes
              const courseMatches = elementText.match(/\b([A-Z]{2,4})\s+(\d{3})\b/g);
              if (courseMatches) {
                for (const match of courseMatches) {
                  if (!courses.includes(match)) {
                    courses.push(match);
                  }
                }
              }
              
              // Stop if we hit another section header
              if (nextElement.tagName.match(/^H[1-6]$/)) {
                break;
              }
              
              nextElement = nextElement.nextElementSibling;
              depth++;
            }
            
            if (courses.length > 0) {
              requirementGroups.push({
                name: sectionName,
                type: 'all',
                courses: courses
              });
            }
          }
        }

        // If no structured requirements found, look for any course codes on the page
        if (requirementGroups.length === 0) {
          const allText = contentElement.textContent || '';
          const allCourseMatches = allText.match(/\b([A-Z]{2,4})\s+(\d{3})\b/g);
          if (allCourseMatches) {
            const uniqueCourses = [...new Set(allCourseMatches)];
            requirementGroups.push({
              name: 'Required Courses',
              type: 'all',
              courses: uniqueCourses
            });
          }
        }

        return requirementGroups;
      });

      if (programData.length === 0) {
        console.log(`⚠️  No requirements found for ${majorName}`);
        return null;
      }

      // Calculate total credits (estimate based on typical course load)
      const totalCredits = programData.reduce((total, group) => {
        return total + (group.courses.length * 1); // Assuming 1 credit per course
      }, 0);

      const program: Program = {
        id: majorId,
        name: majorName,
        type: 'Major',
        totalCredits: Math.max(totalCredits, 32), // Minimum 32 credits for a major
        requirementGroups: programData
      };

      console.log(`✅ Found ${programData.length} requirement groups for ${majorName}`);
      console.log(`📋 Courses found: ${programData.map(g => g.courses.length).join(', ')}`);
      return program;

    } catch (error) {
      console.error(`❌ Error scraping ${majorName}:`, error);
      return null;
    }
  }

  async loadCurrentPrograms() {
    const programsPath = path.join(__dirname, '../data/programs.json');
    
    if (!fs.existsSync(programsPath)) {
      console.log('❌ programs.json not found');
      return { majors: [], minors: [] };
    }
    
    const programsData = JSON.parse(fs.readFileSync(programsPath, 'utf8'));
    return programsData;
  }

  async scrapeAllMajorRequirements() {
    console.log('🌐 Scraping all major requirements from DePauw website...');
    
    const currentData = await this.loadCurrentPrograms();
    const majors = currentData.majors;
    
    console.log(`📊 Found ${majors.length} majors to scrape`);
    
    for (const major of majors) {
      try {
        const updatedMajor = await this.scrapeMajorRequirements(major.id, major.name);
        
        if (updatedMajor) {
          this.programs.push(updatedMajor);
        }
        
        // Add delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.error(`Failed to scrape ${major.name}:`, error);
      }
    }
    
    console.log(`🎯 Total majors scraped: ${this.programs.length}`);
  }

  async updateProgramsData() {
    console.log('💾 Updating programs.json with precise requirements...');
    
    const currentData = await this.loadCurrentPrograms();
    
    // Update majors with precise requirements
    const updatedMajors = currentData.majors.map((major: any) => {
      const scrapedProgram = this.programs.find(p => p.id === major.id);
      if (scrapedProgram) {
        return {
          ...major,
          totalCredits: scrapedProgram.totalCredits,
          requirementGroups: scrapedProgram.requirementGroups
        };
      }
      return major;
    });
    
    const updatedData = {
      ...currentData,
      majors: updatedMajors
    };
    
    // Update programs.json
    const programsPath = path.join(__dirname, '../data/programs.json');
    fs.writeFileSync(programsPath, JSON.stringify(updatedData, null, 2));
    
    // Also update the dist folder
    const distProgramsPath = path.join(__dirname, '../../dist/data/programs.json');
    fs.writeFileSync(distProgramsPath, JSON.stringify(updatedData, null, 2));
    
    console.log('✅ Updated programs.json with precise requirements');
  }

  async generateReport() {
    console.log('\n📋 PRECISE REQUIREMENTS REPORT');
    console.log('==============================');
    console.log(`Majors scraped: ${this.programs.length}`);
    
    // Show some examples
    const samplePrograms = this.programs.slice(0, 3);
    console.log('\n📚 Sample major requirements:');
    samplePrograms.forEach(program => {
      console.log(`\n${program.name}:`);
      program.requirementGroups.forEach(group => {
        console.log(`  ${group.name}: ${group.courses.length} courses`);
        if (group.courses.length > 0) {
          console.log(`    Courses: ${group.courses.slice(0, 5).join(', ')}${group.courses.length > 5 ? '...' : ''}`);
        }
      });
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
      await this.scrapeAllMajorRequirements();
      await this.updateProgramsData();
      await this.generateReport();
    } catch (error) {
      console.error('❌ Error in precise requirements scraping:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the scraper
const scraper = new PreciseRequirementsScraper();
scraper.run().then(() => {
  console.log('✅ Precise requirements scraping complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Precise requirements scraping failed:', error);
  process.exit(1);
});
