# Gmail Status Tracker - Development Notes

## Version Management

The project uses semantic versioning in the menu title within `main.gs`.

**Important**: When making any feature changes, bug fixes, or improvements to the code, you must increment the version number in the menu title. Then deploy it after incrementing.

### Current Version

- Location: `main.gs:5` in the `onOpen()` function
- Format: `ui.createMenu('Status Tracker v2.7.3')`

### Version Increment Rules

- **Patch version** (e.g., v1.3.0 → v1.3.1): Bug fixes, minor improvements, configuration changes
- **Minor version** (e.g., v1.3.1 → v1.4.0): New features, significant enhancements
- **Major version** (e.g., v1.3.1 → v2.0.0): Breaking changes, major restructuring

## Deployment

This project uses [clasp](https://github.com/google/clasp) to deploy Google Apps Script code, with automated version management, changelog generation, and GitHub releases.

### **AUTOMATED DEPLOYMENT WORKFLOW**

**ALWAYS use one of these commands for deployment:**

#### Option 1: Quick Deployment (Patch Version)

```bash
npm run deploy:patch
```

#### Option 2: Feature Deployment (Minor Version)

```bash
npm run deploy:minor
```

#### Option 3: Breaking Changes (Major Version)

```bash
npm run deploy:major
```

#### Option 4: Manual Version Control

```bash
npm version patch|minor|major
npm run deploy
```

### What the Automated Deployment Does

1. **Increments version** in `package.json`
2. **Updates version** in `main.gs:5` automatically
3. **Updates version** in `CLAUDE.md` automatically
4. **Generates changelog** from git commits
5. **Deploys to Apps Script** with `clasp push`
6. **Creates GitHub release** with release notes

### Prerequisites

1. **Install dependencies**: `npm install`
2. **Set GitHub token**: `export GITHUB_TOKEN=your_token_here`
   - Create token at: https://github.com/settings/tokens
   - Requires `repo` permissions
3. **Configure repository URL** in `package.json` if needed

## Code Style

- Always add a newline at the end of files when creating or updating them
