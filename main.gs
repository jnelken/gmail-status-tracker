// Main menu and entry point

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Status Tracker v2.8.0')
    .addItem('Sync All (Gmail + Calendar)', 'syncAllData')
    .addItem('Request Sync from All Accounts', 'requestSyncFromAllAccounts')
    .addSeparator()
    .addItem('Sync Gmail to Sheet', 'exportStatusTrackerEmails')
    .addItem('Sync Calendar Events', 'exportCalendarEvents')
    .addItem('Update Last Scheduled', 'updateLastScheduledColumn')
    .addSeparator()
    .addItem('Setup Daily Auto-Sync', 'setupTrigger')
    .addItem('Remove Auto-Sync', 'removeTrigger')
    .addSeparator()
    .addItem('Backfill from Gmail', 'backfillFromGmail')
    .addItem('Deduplicate Email Sheet', 'deduplicateEmailSheet')
    .addSeparator()
    .addItem('Process Ignored Emails', 'processIgnoredEmails')
    .addToUi();
}