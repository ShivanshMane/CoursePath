import DepauwScraper from '../scraping/depauwScraper';
import RealisticDataGenerator from '../scraping/realisticDataGenerator';
import fs from 'fs';
import path from 'path';

interface ScrapedData {
  programs: any[];
  courses: any[];
  lastUpdated: string;
}

export class ScraperService {
  private scraper: DepauwScraper;
  private dataGenerator: RealisticDataGenerator;
  private dataDir: string;

  constructor() {
    this.scraper = new DepauwScraper();
    this.dataGenerator = new RealisticDataGenerator();
    this.dataDir = path.join(__dirname, '../data');
  }

  /**
   * Run the scraper and update the JSON files
   */
  async runScraper(): Promise<{ success: boolean; message: string; data?: ScrapedData }> {
    try {
      console.log('🔄 Starting scraper service...');
      
      // Use web scraper to get real DePauw data
      const useRealisticData = false;
      
      let scrapedData: ScrapedData;
      
      if (useRealisticData) {
        console.log('📊 Generating realistic DePauw data for demo...');
        scrapedData = this.dataGenerator.generateRealisticData();
        await this.dataGenerator.saveToFiles(scrapedData);
      } else {
        console.log('🌐 Running web scraper...');
        scrapedData = await this.scraper.scrapeAll();
        await this.scraper.saveToFiles(scrapedData);
      }
      
      // Also update the existing files to maintain compatibility
      await this.updateExistingFiles(scrapedData);
      
      console.log('✅ Scraper service completed successfully');
      
      return {
        success: true,
        message: `Successfully generated ${scrapedData.programs.length} programs and ${scrapedData.courses.length} courses`,
        data: scrapedData
      };
      
    } catch (error) {
      console.error('❌ Scraper service failed:', error);
      
      return {
        success: false,
        message: `Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Update the existing programs.json and courses.json files
   */
  private async updateExistingFiles(data: ScrapedData): Promise<void> {
    try {
      // Update programs.json to match existing schema
      const programsData = {
        majors: data.programs.filter(p => p.type === 'Major'),
        minors: data.programs.filter(p => p.type === 'Minor'),
        generalEducation: this.getDefaultGenEd()
      };
      
      const programsPath = path.join(this.dataDir, 'programs.json');
      fs.writeFileSync(programsPath, JSON.stringify(programsData, null, 2));
      
      // Update courses.json to match existing schema
      const coursesData = {
        courses: data.courses
      };
      
      const coursesPath = path.join(this.dataDir, 'courses.json');
      fs.writeFileSync(coursesPath, JSON.stringify(coursesData, null, 2));
      
      console.log('📝 Updated existing JSON files with scraped data');
      
    } catch (error) {
      console.error('Error updating existing files:', error);
      throw error;
    }
  }

  /**
   * Get the last updated timestamp
   */
  getLastUpdated(): string | null {
    try {
      const combinedPath = path.join(this.dataDir, 'scraped-data.json');
      if (fs.existsSync(combinedPath)) {
        const data = JSON.parse(fs.readFileSync(combinedPath, 'utf-8'));
        return data.lastUpdated || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting last updated timestamp:', error);
      return null;
    }
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
          courses: ["FYSE 101", "FYSE 102", "FYSE 103"]
        },
        {
          category: "Writing",
          credits: 4,
          description: "Composition and rhetoric course",
          courses: ["WRIT 101", "WRIT 102"]
        },
        {
          category: "Quantitative Reasoning",
          credits: 4,
          description: "Mathematics or statistics course",
          courses: ["MATH 130", "MATH 151", "STAT 120"]
        },
        {
          category: "Natural Science",
          credits: 8,
          description: "Two courses in natural sciences",
          courses: ["BIOL 141", "CHEM 131", "PHYS 141", "GEOL 101"]
        },
        {
          category: "Social Science",
          credits: 8,
          description: "Two courses in social sciences",
          courses: ["ECON 100", "PSYC 100", "SOCI 100", "POLS 100"]
        },
        {
          category: "Arts and Humanities",
          credits: 8,
          description: "Two courses in arts and humanities",
          courses: ["ENGL 150", "HIST 100", "ART 101", "MUS 101"]
        },
        {
          category: "Global Perspectives",
          credits: 4,
          description: "Course with international focus",
          courses: ["HIST 200", "POLS 200", "LANG 200"]
        },
        {
          category: "Values and Ethics",
          credits: 4,
          description: "Course exploring ethical reasoning",
          courses: ["PHIL 100", "REL 100", "ENVS 200"]
        },
        {
          category: "Physical Education",
          credits: 4,
          description: "Two semesters of physical education",
          courses: ["PE 101", "PE 102"]
        }
      ]
    };
  }
}

export default ScraperService;
