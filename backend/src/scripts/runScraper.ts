#!/usr/bin/env ts-node

import ScraperService from '../services/scraperService';

/**
 * CLI script to run the DePauw catalog scraper
 * Usage: npm run scrape
 */
async function runScraper() {
  console.log('🚀 Starting DePauw Catalog Scraper...');
  console.log('=====================================');
  
  const scraperService = new ScraperService();
  
  try {
    const result = await scraperService.runScraper();
    
    if (result.success) {
      console.log('✅ Scraping completed successfully!');
      console.log(`📊 Results: ${result.message}`);
      
      if (result.data) {
        console.log(`📚 Programs: ${result.data.programs.length}`);
        console.log(`📖 Courses: ${result.data.courses.length}`);
        console.log(`🕒 Last Updated: ${result.data.lastUpdated}`);
      }
      
      console.log('\n🎉 Your CoursePath application now has fresh data from DePauw\'s catalog!');
      console.log('💡 Restart your backend server to serve the updated data.');
      
    } else {
      console.error('❌ Scraping failed!');
      console.error(`Error: ${result.message}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Fatal error during scraping:');
    console.error(error);
    process.exit(1);
  }
}

// Run the scraper
runScraper();
