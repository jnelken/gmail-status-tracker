#!/usr/bin/env node

const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const { execSync } = require('child_process');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

async function createRelease() {
  // Check for GitHub token
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('❌ GITHUB_TOKEN environment variable is required');
    console.log('💡 Create a token at: https://github.com/settings/tokens');
    process.exit(1);
  }

  const octokit = new Octokit({ auth: token });

  try {
    // Get repository info from git remote
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    
    if (!match) {
      console.error('❌ Could not parse GitHub repository from remote URL');
      process.exit(1);
    }

    const [, owner, repo] = match;
    console.log(`📦 Creating release for ${owner}/${repo} v${version}`);

    // Generate release notes from recent commits
    let releaseNotes = '';
    try {
      // Get commits since last tag
      const lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo ""', { encoding: 'utf8' }).trim();
      const commitRange = lastTag ? `${lastTag}..HEAD` : 'HEAD';
      const commits = execSync(`git log ${commitRange} --pretty=format:"- %s (%h)"`, { encoding: 'utf8' }).trim();
      
      if (commits) {
        releaseNotes = `## Changes\n\n${commits}`;
      } else {
        releaseNotes = `## Version ${version}\n\nSee CHANGELOG.md for details.`;
      }
    } catch (error) {
      releaseNotes = `## Version ${version}\n\nSee CHANGELOG.md for details.`;
    }

    // Create the release
    const release = await octokit.rest.repos.createRelease({
      owner,
      repo,
      tag_name: `v${version}`,
      target_commitish: 'main',
      name: `v${version}`,
      body: releaseNotes,
      draft: false,
      prerelease: false,
    });

    console.log(`✅ Created release: ${release.data.html_url}`);
    console.log(`🎉 Version ${version} has been released!`);

  } catch (error) {
    if (error.status === 422 && error.response?.data?.errors?.some(e => e.code === 'already_exists')) {
      console.log(`⚠️  Release v${version} already exists`);
    } else {
      console.error('❌ Error creating release:', error.message);
      process.exit(1);
    }
  }
}

createRelease();