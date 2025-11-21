import express from 'express';
import ScraperService from '../services/scraperService';

const router = express.Router();
const scraperService = new ScraperService();

/**
 * POST /api/scraper/run
 * Trigger the scraper to fetch fresh data from DePauw's catalog
 */
router.post('/run', async (req, res) => {
  try {
    console.log('🚀 Manual scraper run requested');
    
    const result = await scraperService.runScraper();
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        lastUpdated: result.data?.lastUpdated,
        stats: {
          programs: result.data?.programs.length || 0,
          courses: result.data?.courses.length || 0
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Scraper route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during scraping',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * GET /api/scraper/status
 * Get the last update timestamp and scraper status
 */
router.get('/status', (req, res) => {
  try {
    const lastUpdated = scraperService.getLastUpdated();
    
    res.json({
      success: true,
      lastUpdated,
      message: lastUpdated 
        ? `Data last updated: ${new Date(lastUpdated).toLocaleString()}`
        : 'No scraped data available'
    });
  } catch (error) {
    console.error('Status route error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting scraper status',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

export default router;
