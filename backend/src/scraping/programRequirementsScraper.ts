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

class ProgramRequirementsScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private programs: Program[] = [];
  
  // All majors and minors from DePauw
  private programMappings: { [key: string]: string } = {
    'accounting-finance-major': 'accounting-finance',
    'actuarial-science-major': 'actuarial-science',
    'africana-studies-major': 'africana-studies',
    'anthropology-major': 'anthropology',
    'applied-statistics-major': 'applied-statistics',
    'art-history-major': 'art-history',
    'asian-studies-major': 'asian-studies',
    'astronomy-major': 'astronomy',
    'biochemistry-major': 'biochemistry',
    'biology-major': 'biology',
    'chemistry-major': 'chemistry',
    'classical-studies-major': 'classical-studies',
    'communication-major': 'communication',
    'computer-science-major': 'computer-science',
    'creative-writing-major': 'creative-writing',
    'data-science-major': 'data-science',
    'economics-major': 'economics',
    'education-major': 'education',
    'engineering-major': 'engineering',
    'english-literature-major': 'english-literature',
    'environmental-geoscience-major': 'environmental-geoscience',
    'environmental-science-major': 'environmental-science',
    'film-studies-major': 'film-studies',
    'french-major': 'french',
    'geology-major': 'geology',
    'german-major': 'german',
    'history-major': 'history',
    'international-studies-major': 'international-studies',
    'japanese-major': 'japanese',
    'kinesiology-major': 'kinesiology',
    'latin-american-caribbean-studies-major': 'latin-american-caribbean-studies',
    'mathematics-major': 'mathematics',
    'media-major': 'media',
    'music-major': 'music',
    'neuroscience-major': 'neuroscience',
    'peace-and-conflict-studies-major': 'peace-and-conflict-studies',
    'philosophy-major': 'philosophy',
    'physics-major': 'physics',
    'political-science-major': 'political-science',
    'psychology-major': 'psychology',
    'religion-major': 'religion',
    'rhetoric-major': 'rhetoric',
    'romance-languages-major': 'romance-languages',
    'sociology-major': 'sociology',
    'spanish-major': 'spanish',
    'sustainability-major': 'sustainability',
    'theatre-major': 'theatre',
    'women-gender-sexuality-studies-major': 'women-gender-sexuality-studies',
    'world-literature-major': 'world-literature',
    'writing-major': 'writing'
  };

  async initialize() {
    console.log('🚀 Initializing Program Requirements Scraper...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
  }

  async scrapeProgramRequirements(programId: string, programName: string, programType: 'Major' | 'Minor'): Promise<Program | null> {
    const urlPath = this.programMappings[programId];
    if (!urlPath) {
      console.log(`⚠️  No URL mapping for program: ${programId}`);
      return null;
    }

    const url = `https://www.depauw.edu/academics/majors-and-minors/about-${urlPath}/requirements/`;
    
    try {
      console.log(`📚 Scraping requirements for ${programName} from: ${url}`);
      await this.page!.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      const programData = await this.page!.evaluate(() => {
        const requirementGroups: RequirementGroup[] = [];
        
        // Look for various requirement structures
        const selectors = [
          'h2, h3, h4',
          '.requirement-section',
          '.course-requirements',
          '.requirements',
          '[class*="requirement"]',
          '[class*="course"]',
          'ul li',
          'ol li'
        ];

        let currentGroup: RequirementGroup | null = null;
        const processedGroups = new Set<string>();

        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          
          for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const text = element.textContent || '';
            
            // Look for section headers
            if (element.tagName.match(/^H[1-6]$/)) {
              const headerText = text.trim().toLowerCase();
              
              // Common requirement section patterns
              if (headerText.includes('core') || headerText.includes('required') || 
                  headerText.includes('foundation') || headerText.includes('prerequisite')) {
                if (currentGroup && currentGroup.courses.length > 0) {
                  requirementGroups.push(currentGroup);
                }
                currentGroup = {
                  name: text.trim(),
                  type: 'all',
                  courses: []
                };
              } else if (headerText.includes('elective') || headerText.includes('choose') || 
                        headerText.includes('option') || headerText.includes('select')) {
                if (currentGroup && currentGroup.courses.length > 0) {
                  requirementGroups.push(currentGroup);
                }
                currentGroup = {
                  name: text.trim(),
                  type: 'choose',
                  courses: []
                };
              }
            }
            
            // Look for course codes in the text
            const courseMatches = text.match(/\b([A-Z]{2,4})\s+(\d{3})\b/g);
            if (courseMatches && currentGroup) {
              for (const match of courseMatches) {
                if (!currentGroup.courses.includes(match)) {
                  currentGroup.courses.push(match);
                }
              }
            }
          }
        }

        // Add the last group if it has courses
        if (currentGroup && currentGroup.courses.length > 0) {
          requirementGroups.push(currentGroup);
        }

        // If no structured requirements found, look for any course codes on the page
        if (requirementGroups.length === 0) {
          const allText = document.body.textContent || '';
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
        console.log(`⚠️  No requirements found for ${programName}`);
        return null;
      }

      // Calculate total credits (estimate based on typical course load)
      const totalCredits = programData.reduce((total, group) => {
        return total + (group.courses.length * 1); // Assuming 1 credit per course
      }, 0);

      const program: Program = {
        id: programId,
        name: programName,
        type: programType,
        totalCredits: Math.max(totalCredits, 32), // Minimum 32 credits for a major
        requirementGroups: programData
      };

      console.log(`✅ Found ${programData.length} requirement groups for ${programName}`);
      return program;

    } catch (error) {
      console.error(`❌ Error scraping ${programName}:`, error);
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

  async scrapeAllProgramRequirements() {
    console.log('🌐 Scraping all program requirements from DePauw website...');
    
    const currentData = await this.loadCurrentPrograms();
    const allPrograms = [...currentData.majors, ...currentData.minors];
    
    console.log(`📊 Found ${allPrograms.length} programs to scrape`);
    
    for (const program of allPrograms) {
      try {
        const programType = program.type === 'Major' ? 'Major' : 'Minor';
        const updatedProgram = await this.scrapeProgramRequirements(
          program.id, 
          program.name, 
          programType
        );
        
        if (updatedProgram) {
          this.programs.push(updatedProgram);
        }
        
        // Add delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Failed to scrape ${program.name}:`, error);
      }
    }
    
    console.log(`🎯 Total programs scraped: ${this.programs.length}`);
  }

  async updateProgramsData() {
    console.log('💾 Updating programs.json with scraped requirements...');
    
    const currentData = await this.loadCurrentPrograms();
    
    // Update majors
    const updatedMajors = currentData.majors.map((major: any) => {
      const scrapedProgram = this.programs.find(p => p.id === major.id && p.type === 'Major');
      if (scrapedProgram) {
        return {
          ...major,
          totalCredits: scrapedProgram.totalCredits,
          requirementGroups: scrapedProgram.requirementGroups
        };
      }
      return major;
    });
    
    // Update minors
    const updatedMinors = currentData.minors.map((minor: any) => {
      const scrapedProgram = this.programs.find(p => p.id === minor.id && p.type === 'Minor');
      if (scrapedProgram) {
        return {
          ...minor,
          totalCredits: scrapedProgram.totalCredits,
          requirementGroups: scrapedProgram.requirementGroups
        };
      }
      return minor;
    });
    
    const updatedData = {
      ...currentData,
      majors: updatedMajors,
      minors: updatedMinors
    };
    
    // Update programs.json
    const programsPath = path.join(__dirname, '../data/programs.json');
    fs.writeFileSync(programsPath, JSON.stringify(updatedData, null, 2));
    
    // Also update the dist folder
    const distProgramsPath = path.join(__dirname, '../../dist/data/programs.json');
    fs.writeFileSync(distProgramsPath, JSON.stringify(updatedData, null, 2));
    
    console.log('✅ Updated programs.json with scraped requirements');
  }

  async generateReport() {
    console.log('\n📋 PROGRAM REQUIREMENTS REPORT');
    console.log('==============================');
    console.log(`Programs scraped: ${this.programs.length}`);
    
    // Show some examples
    const samplePrograms = this.programs.slice(0, 5);
    console.log('\n📚 Sample program requirements:');
    samplePrograms.forEach(program => {
      console.log(`\n${program.name} (${program.type}):`);
      program.requirementGroups.forEach(group => {
        console.log(`  ${group.name}: ${group.courses.length} courses`);
        if (group.courses.length > 0) {
          console.log(`    Courses: ${group.courses.slice(0, 3).join(', ')}${group.courses.length > 3 ? '...' : ''}`);
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
      await this.scrapeAllProgramRequirements();
      await this.updateProgramsData();
      await this.generateReport();
    } catch (error) {
      console.error('❌ Error in program requirements scraping:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the scraper
const scraper = new ProgramRequirementsScraper();
scraper.run().then(() => {
  console.log('✅ Program requirements scraping complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Program requirements scraping failed:', error);
  process.exit(1);
});
