import { DepauwWebScraper } from '../scraping/depauwWebScraper';
import path from 'path';

async function runScraper() {
  console.log('🚀 Starting DePauw University web scraper...');
  
  const scraper = new DepauwWebScraper();
  
  try {
    // Scrape all data
    const data = await scraper.scrapeAllData();
    
    // Save data to files
    await scraper.saveData(data);
    
    console.log('✅ Scraping completed successfully!');
    console.log('📁 Data files updated:');
    console.log('  - programs.json');
    console.log('  - courses.json');
    
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    process.exit(1);
  }
}

// Run the scraper
runScraper();
