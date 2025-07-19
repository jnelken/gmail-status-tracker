function getIgnoredThreadIds() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let ignoredSheet = spreadsheet.getSheetByName(SHEET_IGNORED_EMAILS);

    if (!ignoredSheet) {
      return new Set();
    }

    const columnMap = getColumnMap(ignoredSheet);
    if (!columnMap[EMAIL_THREAD_ID]) {
      return new Set();
    }

    const data = ignoredSheet.getDataRange().getValues();
    const threadIdCol = columnMap[EMAIL_THREAD_ID];

    const ignoredThreadIds = new Set(
      data
        .slice(1)
        .map(row => row[threadIdCol])
        .filter(id => id),
    );

    return ignoredThreadIds;
  } catch (error) {
    Logger.log(`Error getting ignored thread IDs: ${error}`);
    return new Set();
  }
}

function moveIgnoredEmailsToIgnoredSheet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const emailsSheet = spreadsheet.getSheetByName(SHEET_EMAILS);

    if (!emailsSheet || emailsSheet.getLastRow() <= 1) {
      Logger.log('No emails sheet or no data to process');
      return 0;
    }

    let ignoredSheet = getOrCreateIgnoredEmailsSheet(spreadsheet);

    const emailsColumnMap = getColumnMap(emailsSheet);
    const statusCol = emailsColumnMap[EMAIL_STATUS];

    if (statusCol === undefined) {
      Logger.log('Status column not found in emails sheet');
      return 0;
    }

    const data = emailsSheet.getDataRange().getValues();
    const headers = data[0];
    const rowsToMove = [];
    const rowIndicesToDelete = [];

    for (let i = 1; i < data.length; i++) {
      const status = data[i][statusCol];
      if (status && status === EMAIL_STATUS_IGNORE_VALUE) {
        rowsToMove.push(data[i]);
        rowIndicesToDelete.push(i + 1);
      }
    }

    if (rowsToMove.length === 0) {
      Logger.log('No emails marked as ignored found');
      return 0;
    }

    if (ignoredSheet.getLastRow() === 0) {
      ignoredSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      ignoredSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      ignoredSheet.setFrozenRows(1);
    }

    const startRow = ignoredSheet.getLastRow() + 1;
    ignoredSheet
      .getRange(startRow, 1, rowsToMove.length, rowsToMove[0].length)
      .setValues(rowsToMove);

    for (let i = rowIndicesToDelete.length - 1; i >= 0; i--) {
      emailsSheet.deleteRow(rowIndicesToDelete[i]);
    }

    try {
      ignoredSheet.autoResizeColumns(1, headers.length);
    } catch (error) {
      Logger.log(
        'Note: Could not auto-resize columns (Table formatting may be active)',
      );
    }

    Logger.log(`Moved ${rowsToMove.length} ignored emails to ignored sheet`);
    return rowsToMove.length;
  } catch (error) {
    Logger.log(`Error moving ignored emails: ${error}`);
    return 0;
  }
}

function getOrCreateIgnoredEmailsSheet(spreadsheet) {
  let ignoredSheet = spreadsheet.getSheetByName(SHEET_IGNORED_EMAILS);

  if (!ignoredSheet) {
    ignoredSheet = spreadsheet.insertSheet(SHEET_IGNORED_EMAILS);
    Logger.log(`Created new sheet: ${SHEET_IGNORED_EMAILS}`);
  }

  return ignoredSheet;
}

function processIgnoredEmails() {
  const movedCount = moveIgnoredEmailsToIgnoredSheet();

  if (movedCount > 0) {
    try {
      recordSyncActivity('Email Cleanup', 0, 0, movedCount);
    } catch (error) {
      Logger.log(`Sync activity recording skipped: ${error}`);
    }
  }

  return movedCount;
}
