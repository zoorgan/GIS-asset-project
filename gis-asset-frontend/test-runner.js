const { spawn } = require('child_process');
const path = require('path');

const chromeBin = process.env.CHROME_BIN || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
process.env.CHROME_BIN = chromeBin;

console.log('Starting Angular test suite with CHROME_BIN:', chromeBin);

const ngBin = path.join(__dirname, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');

const child = spawn(process.execPath, [ngBin, 'test', '--watch=false', '--progress=false'], {
  cwd: __dirname,
  env: { ...process.env, CHROME_BIN: chromeBin },
  stdio: ['ignore', 'pipe', 'pipe']
});

child.stdout.on('data', (chunk) => {
  process.stdout.write(chunk.toString());
});

child.stderr.on('data', (chunk) => {
  process.stderr.write(chunk.toString());
});

child.on('error', (err) => {
  console.error('Failed to start ng test process:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log('\n--- Test Process Completed with code:', code, '---');
  process.exit(code || 0);
});
