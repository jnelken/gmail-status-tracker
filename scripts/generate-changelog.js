#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

try {
  // Generate changelog using conventional-changelog
  console.log('📝 Generating changelog...');
  
  // Check if CHANGELOG.md exists, if not create it
  const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
  if (!fs.existsSync(changelogPath)) {
    fs.writeFileSync(changelogPath, '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n');
  }
  
  // Generate changelog entry
  const command = 'npx conventional-changelog -p angular -i CHANGELOG.md -s';
  execSync(command, { stdio: 'inherit' });
  
  console.log(`✅ Updated CHANGELOG.md for version ${version}`);
} catch (error) {
  console.error('❌ Error generating changelog:', error.message);
  process.exit(1);
}