// Cross-account sync coordination functions

function requestSyncFromAllAccounts() {
  try {
    // Set sync request timestamp in Configuration sheet
    const now = new Date();
    setConfigValue(SPREADSHEET_ID, CONFIG_SYNC_REQUEST, now.toISOString());

    // Also trigger our own sync
    syncAllData();

    Logger.log(
      'Sync request sent to all accounts with access to this spreadsheet',
    );
  } catch (error) {
    Logger.log(`Error requesting sync from all accounts: ${error}`);
  }
}

function shouldSyncBasedOnRequest() {
  try {
    const syncRequestValue = getConfigValue(SPREADSHEET_ID, CONFIG_SYNC_REQUEST);

    if (!syncRequestValue) {
      return false;
    }

    const syncRequestTime = new Date(syncRequestValue);
    const now = new Date();
    const timeDiffMinutes =
      (now.getTime() - syncRequestTime.getTime()) / (1000 * 60);

    // If sync request is within last 5 minutes, sync
    return timeDiffMinutes <= 5;
  } catch (error) {
    Logger.log(`Error checking sync request: ${error}`);
    return false;
  }
}

function scheduledSyncCheck() {
  // This function runs on schedule and checks for sync requests
  if (shouldSyncBasedOnRequest()) {
    Logger.log('Syncing in response to cross-account sync request');
    syncAllData();
  } else {
    // Regular scheduled sync
    syncAllData();
  }
}

function checkForSyncRequests() {
  // This function runs every 5 minutes to check for cross-account sync requests
  if (shouldSyncBasedOnRequest()) {
    Logger.log('Cross-account sync request detected. Running immediate sync...');
    syncAllData();
  }
}

function syncAllData() {
  exportStatusTrackerEmails();
  exportCalendarEvents();
  // Each function will log its own activity separately
}

function getEmailCount() {
  try {
    const sheet = getOrCreateSheet(SPREADSHEET_ID, SHEET_EMAILS);
    return Math.max(0, sheet.getLastRow() - 1); // Subtract header row
  } catch (error) {
    return 0;
  }
}

function getEventCount() {
  try {
    const sheet = getOrCreateSheet(SPREADSHEET_ID, SHEET_CALENDAR_EVENTS);
    return Math.max(0, sheet.getLastRow() - 1); // Subtract header row
  } catch (error) {
    return 0;
  }
}