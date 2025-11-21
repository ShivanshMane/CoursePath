import { spawn } from 'child_process';
import * as path from 'path';

console.log('🔍 Starting Comprehensive Course Verification...');

const scriptPath = path.join(__dirname, '../scraping/comprehensiveCourseVerifier.ts');

const child = spawn('npx', ['ts-node', scriptPath], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '../..')
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Course verification completed successfully!');
  } else {
    console.error('❌ Course verification failed with code:', code);
  }
  process.exit(code || 0);
});

child.on('error', (error) => {
  console.error('❌ Error running course verification:', error);
  process.exit(1);
});