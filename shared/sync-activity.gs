// Sync activity tracking functions - Manual operations only

function recordSyncActivity(syncType, emailsAdded = 0, eventsAdded = 0, backfillsUpdated = 0) {
  try {
    // Get the current user's email - only works in manual context
    const userEmail = Session.getActiveUser().getEmail();
    
    // Get or create the sync activity sheet
    let sheet = getOrCreateSheet(SPREADSHEET_ID, SHEET_SYNC_ACTIVITY);
    
    // Set up headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      const headers = getSyncActivityHeaders();
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    
    const columnMap = getColumnMap(sheet);
    const now = new Date();
    
    // Insert new log entry at the top (row 2, after headers)
    const insertRow = 2;
    
    // Insert a new row at position 2
    sheet.insertRowAfter(1);
    
    // Create row data array with proper column order
    const rowData = new Array(Object.keys(columnMap).length).fill('');
    rowData[columnMap[SYNC_TIMESTAMP]] = now;
    rowData[columnMap[SYNC_ACCOUNT]] = userEmail;
    rowData[columnMap[SYNC_TYPE]] = syncType;
    rowData[columnMap[SYNC_EMAILS_ADDED]] = emailsAdded;
    rowData[columnMap[SYNC_EVENTS_ADDED]] = eventsAdded;
    rowData[columnMap[SYNC_BACKFILLS_UPDATED]] = backfillsUpdated;
    
    // Add the new log entry at the top
    sheet.getRange(insertRow, 1, 1, rowData.length).setValues([rowData]);
    
    // Format the timestamp column
    try {
      const timestampCol = columnMap[SYNC_TIMESTAMP] + 1;
      sheet.getRange(insertRow, timestampCol, 1, 1).setNumberFormat('mm/dd/yyyy hh:mm:ss');
    } catch (error) {
      Logger.log('Note: Could not format timestamp column');
    }
    
    Logger.log(`Recorded sync activity for ${userEmail}: ${syncType} - ${emailsAdded} emails, ${eventsAdded} events, ${backfillsUpdated} backfills at ${now}`);
  } catch (error) {
    Logger.log(`Error recording sync activity: ${error}`);
  }
}