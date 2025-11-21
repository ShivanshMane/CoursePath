import { RobustDepauwScraper } from '../scraping/robustDepauwScraper';
import path from 'path';

async function runRobustScraper() {
  console.log('🚀 Starting robust DePauw University web scraper...');
  
  const scraper = new RobustDepauwScraper();
  
  try {
    // Scrape all data
    const data = await scraper.scrapeAllData();
    
    // Save data to files
    await scraper.saveData(data);
    
    console.log('✅ Robust scraping completed successfully!');
    console.log('📁 Data files updated:');
    console.log('  - programs.json');
    console.log('  - courses.json');
    console.log(`📊 Total programs: ${data.programs.length}`);
    console.log(`📚 Total courses: ${data.courses.length}`);
    
  } catch (error) {
    console.error('❌ Robust scraping failed:', error);
    process.exit(1);
  }
}

// Run the robust scraper
runRobustScraper();
