const { execSync } = require('child_process');

process.env.CHROME_BIN = process.env.CHROME_BIN || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

console.log('Running ng test with Chrome...');
try {
  const output = execSync('npx ng test --watch=false --browsers=ChromeHeadlessCI', {
    stdio: 'inherit',
    env: process.env,
    maxBuffer: 10 * 1024 * 1024
  });
  console.log('Test run finished successfully!');
} catch (err) {
  console.error('Test run error:', err.message);
  process.exit(1);
}
