const fs = require('fs');
const path = require('path');

// 1. Generate unique build version using current timestamp
const timestamp = Date.now();
const version = `1.0.${timestamp}`;
const buildTime = new Date().toISOString();

console.log(`[Build] Generating build version: ${version}...`);

// 2. Create / Update version.json
const versionFilePath = path.join(__dirname, 'version.json');
const versionData = {
  version,
  buildTime,
  appName: "Apli PMPML"
};
fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2), 'utf8');
console.log(`[Build] Updated version.json`);

// 3. Update CACHE_NAME in service-worker.js
const swFilePath = path.join(__dirname, 'service-worker.js');
if (fs.existsSync(swFilePath)) {
  let swContent = fs.readFileSync(swFilePath, 'utf8');
  const newCacheName = `apli-pmpml-v${version}`;

  // Replace CACHE_NAME declaration
  const regex = /const\s+CACHE_NAME\s*=\s*['"`][^'"`]+['"`];/;
  if (regex.test(swContent)) {
    swContent = swContent.replace(regex, `const CACHE_NAME = '${newCacheName}';`);
    fs.writeFileSync(swFilePath, swContent, 'utf8');
    console.log(`[Build] Updated service-worker.js CACHE_NAME to: ${newCacheName}`);
  } else {
    console.warn(`[Build] Warning: Could not find CACHE_NAME match in service-worker.js`);
  }
}

console.log(`[Build] Build completed successfully! Version: ${version}`);
