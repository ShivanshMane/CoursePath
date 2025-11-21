import { EnhancedDescriptionScraper } from '../scraping/enhancedDescriptionScraper';

async function runEnhancedDescriptionScraper() {
  console.log('🚀 Starting enhanced course description scraper...');
  
  const scraper = new EnhancedDescriptionScraper();
  
  try {
    await scraper.scrapeCourseDescriptions();
    console.log('✅ Enhanced course description scraping completed successfully!');
    console.log('📁 Updated courses.json with real course descriptions from /courses/ pages');
    
  } catch (error) {
    console.error('❌ Enhanced course description scraping failed:', error);
    process.exit(1);
  }
}

// Run the enhanced description scraper
runEnhancedDescriptionScraper();
