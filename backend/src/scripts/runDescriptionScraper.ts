import { CourseDescriptionScraper } from '../scraping/courseDescriptionScraper';

async function runDescriptionScraper() {
  console.log('🚀 Starting course description scraper...');
  
  const scraper = new CourseDescriptionScraper();
  
  try {
    await scraper.scrapeCourseDescriptions();
    console.log('✅ Course description scraping completed successfully!');
    console.log('📁 Updated courses.json with real course descriptions');
    
  } catch (error) {
    console.error('❌ Course description scraping failed:', error);
    process.exit(1);
  }
}

// Run the description scraper
runDescriptionScraper();
