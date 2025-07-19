#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read package.json version
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

// Update version in main.gs
const mainPath = path.join(__dirname, '..', 'main.gs');
let mainContent = fs.readFileSync(mainPath, 'utf8');

// Replace version in the menu title
const versionRegex = /(ui\.createMenu\('Status Tracker v)[\d.]+('\))/;
const newMainContent = mainContent.replace(versionRegex, `$1${version}$2`);

if (newMainContent !== mainContent) {
  fs.writeFileSync(mainPath, newMainContent);
  console.log(`✅ Updated main.gs version to v${version}`);
} else {
  console.log('⚠️  No version update needed in main.gs');
}

// Update version in CLAUDE.md
const claudePath = path.join(__dirname, '..', 'CLAUDE.md');
let claudeContent = fs.readFileSync(claudePath, 'utf8');

// Update current version section
const currentVersionRegex = /(- Location: `main\.gs:\d+` in the `onOpen\(\)` function\n- Format: `ui\.createMenu\('Status Tracker v)[\d.]+('\)`)/;
const newClaudeContent = claudeContent.replace(currentVersionRegex, `$1${version}$2`);

if (newClaudeContent !== claudeContent) {
  fs.writeFileSync(claudePath, newClaudeContent);
  console.log(`✅ Updated CLAUDE.md version to v${version}`);
} else {
  console.log('⚠️  No version update needed in CLAUDE.md');
}