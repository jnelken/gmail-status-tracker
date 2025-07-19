# Gmail Status Tracker

A Google Apps Script that automatically exports labeled Gmail emails to a Google Sheets spreadsheet for status tracking and organization.

## Features

- **Gmail & Calendar Integration** - Tracks both emails and calendar events
- **Multi-Account Support** - Works across multiple Google accounts
- **Cross-Account Sync Coordination** - Trigger syncs for all accounts from any account
- **Automatic Scheduling** - Twice-daily auto-sync at 8 AM and 2 PM
- **Configuration Management** - Centralized config in dedicated "Configuration" sheet
- **Company/Organization Matching** - Links calendar events to emails by domain
- **Backfill Support** - Automatically fills missing data for existing entries
- **Column-order independent** (uses header mapping)
- **Duplicate prevention** via Thread ID and Event ID tracking
- **Compatible with Google Sheets Tables**
- **Custom menu integration**

## Project Structure

```directory
status-tracker-sheets/
├── .clasp.json                    # clasp configuration
├── appsscript.json                # Apps Script manifest
├── env.example.gs                 # Environment config template
├── env.gs                         # Environment config (gitignored)
├── main.gs                        # Google Sheets custom menu
├── CLAUDE.md                      # Development notes
├── calendar-tracker-sheet/        # Calendar integration
│   ├── backfill.gs
│   ├── cross-reference.gs
│   ├── export.gs
│   └── parsing.gs
├── gmail-tracker-sheet/           # Gmail integration
│   ├── backfill.gs
│   ├── deduplication.gs
│   └── export.gs
└── shared/                        # Shared utilities
    ├── config.gs
    ├── configuration.gs
    ├── sync-activity.gs
    ├── sync.gs
    ├── triggers.gs
    └── utils.gs
```

## Development Workflow

### Initial Setup

1. Copy `env.example.gs` to `env.gs`
2. Update `SPREADSHEET_ID` in `env.gs` with your Google Sheets ID
3. Deploy to Apps Script: `clasp push`

### Making Changes

1. Edit files locally
2. Update version in `main.gs` (follow semantic versioning)
3. Deploy to Apps Script: `clasp push`
4. Commit changes: `git add . && git commit -m "Description of changes"`

### Testing

1. Open the Apps Script project in your browser
2. Run the `exportGmailTrackerEmails()` function
3. Check execution logs for results

### Common Commands

```bash
# Deploy changes
clasp push

# Pull changes from Apps Script (if edited online)
clasp pull

# View project info
clasp status

# Open project in browser
clasp open
```

## Multi-Account Syncing

### How It Works

The Gmail Tracker supports **cross-account synchronization** using the shared spreadsheet as a coordination mechanism. Multiple Google accounts can access the same spreadsheet, and any account can trigger syncs for all other accounts.

### Manual Cross-Account Sync

**"Request Sync from All Accounts"** menu option:

1. Any account with access clicks this option
2. A timestamp is stored in the Configuration sheet
3. Other accounts' sync request triggers detect this request
4. All accounts sync within 5 minutes of the request

### Automatic Scheduling

**Twice-Daily Auto-Sync** runs automatically:

- **8:00 AM** - Morning sync (Gmail + Calendar)
- **2:00 PM** - Afternoon sync (Gmail + Calendar)

Each account needs to set up their own triggers via:

- Menu: "Setup Daily Auto-Sync"

### Account Setup Requirements

Each Google account that wants to participate needs to:

1. **Have editor access** to the shared spreadsheet
2. **Authorize the script** (first-time setup)
3. **Set up auto-sync triggers** via the menu
4. **Add "gmail-tracker" label** to relevant Gmail emails

### Cross-Account Benefits

- **Centralized data** - All gmail tracking in one shared spreadsheet
- **Multiple email accounts** - Track applications from personal, work, etc.
- **Coordinated updates** - Trigger syncs across all accounts manually
- **Account identification** - "Account" column shows which inbox received each email

## Usage

1. Label emails in Gmail with your chosen label
2. Run the script via the custom menu in your Google Sheet
3. Track and organize your emails in the spreadsheet

## Setup Instructions

### 1. Create Gmail Label

1. In Gmail, create a new label (e.g., "status-tracker")
2. Apply this label to emails you want to track

### 2. Set Up Google Apps Script

1. Install clasp: `npm install -g @google/clasp`
2. Login to clasp: `clasp login`
3. Create new Apps Script project: `clasp create --type standalone --title "Gmail Status Tracker"` (or other preferred name)
   - This automatically generates `.clasp.json` with your Script ID

### 3. Configure Environment

1. Copy `env.example.gs` to `env.gs`
2. Update `SPREADSHEET_ID` in `env.gs` with your Google Sheets ID
   - Find in your Google Sheets URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

### 4. Grant Permissions

1. Run any function to trigger authorization
2. Click "Review permissions" → "Allow"
3. Script needs access to Gmail and Google Sheets

### 5. Deploy and Test

1. Deploy: `clasp push`
2. Test via custom menu in your Google Sheet

## Usage Tips

### Label Strategy

Apply your chosen label to emails you want to track:

- Important correspondence
- Follow-up required emails
- Status updates
- Communications requiring action

### Status Tracking

Use the Status column to track progress: "New", "In Progress", "Waiting", "Complete", "Closed"

### Troubleshooting

- Check execution logs in Apps Script for errors
- Ensure Gmail label is spelled exactly as configured
- Verify edit permissions on Google Sheet
