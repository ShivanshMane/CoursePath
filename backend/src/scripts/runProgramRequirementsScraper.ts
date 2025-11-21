import { spawn } from 'child_process';
import * as path from 'path';

console.log('🔍 Starting Program Requirements Scraping...');

const scriptPath = path.join(__dirname, '../scraping/programRequirementsScraper.ts');

const child = spawn('npx', ['ts-node', scriptPath], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '../..')
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Program requirements scraping completed successfully!');
  } else {
    console.error('❌ Program requirements scraping failed with code:', code);
  }
  process.exit(code || 0);
});

child.on('error', (error) => {
  console.error('❌ Error running program requirements scraping:', error);
  process.exit(1);
});
