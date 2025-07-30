if (process.platform === 'win32') {
  const { execSync } = require('child_process');
  execSync('npm install @rollup/rollup-win32-x64-msvc', { stdio: 'inherit' });
}
