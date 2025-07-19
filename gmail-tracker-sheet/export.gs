// Main email export function

function exportStatusTrackerEmails() {
  // Get or create the spreadsheet
  let sheet = getOrCreateSheet(SPREADSHEET_ID, SHEET_EMAILS);

  // Set up headers if sheet is empty
  if (sheet.getLastRow() === 0) {
    const headers = getEmailHeaders();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  // Get column mapping from headers
  const columnMap = getColumnMap(sheet);

  // Backfill missing sender email data for existing rows
  backfillSenderEmails(sheet, columnMap);

  // Get existing thread IDs to avoid duplicates
  const existingData = sheet.getDataRange().getValues();
  const threadIdCol = columnMap[EMAIL_THREAD_ID];
  const existingThreadIds = new Set(
    existingData
      .slice(1)
      .map(row => row[threadIdCol])
      .filter(id => id), // Remove empty values
  );

  // Search for emails with the configured label
  const threads = GmailApp.search(`label:${GMAIL_LABEL}`, 0, 500);
  const newEmails = [];

  threads.forEach(thread => {
    const threadId = thread.getId();

    // Skip if we've already processed this thread
    if (existingThreadIds.has(threadId)) {
      return;
    }

    // Get the first message in the thread (usually the most relevant)
    const messages = thread.getMessages();
    const firstMessage = messages[0];

    const date = firstMessage.getDate();
    const sender = firstMessage.getFrom();
    const recipient = firstMessage.getTo();
    const subject = firstMessage.getSubject();
    const body = firstMessage.getPlainBody();

    // Extract company name from sender or subject
    const company = extractCompanyName(sender, subject);
    const { name: senderName, email: senderEmail } = parseSender(sender);
    const { email: recipientEmail } = parseSender(recipient);

    // Create a snippet (first 400 characters of body)
    const snippet = body.substring(0, 400).replace(/\n/g, ' ').trim() + '...';

    // Create row array with proper column order
    const rowData = new Array(Object.keys(columnMap).length).fill('');
    rowData[columnMap[EMAIL_DATE]] = date;
    rowData[columnMap[EMAIL_COMPANY]] = company;
    rowData[columnMap[EMAIL_SENDER_NAME]] = senderName;
    rowData[columnMap[EMAIL_SENDER_EMAIL]] = senderEmail;
    rowData[columnMap[EMAIL_SUBJECT]] = subject;
    rowData[columnMap[EMAIL_SNIPPET]] = snippet;
    rowData[columnMap[EMAIL_STATUS]] = '1.New';
    rowData[columnMap[EMAIL_THREAD_ID]] = threadId;
    if (columnMap[EMAIL_ACCOUNT] !== undefined) {
      rowData[columnMap[EMAIL_ACCOUNT]] = recipientEmail;
    }
    if (columnMap[EMAIL_VERSION] !== undefined) {
      rowData[columnMap[EMAIL_VERSION]] = getCurrentVersion();
    }
    if (columnMap[EMAIL_SENT_ON] !== undefined) {
      rowData[columnMap[EMAIL_SENT_ON]] = date;
    }

    newEmails.push(rowData);
  });

  // Add new emails to the sheet
  if (newEmails.length > 0) {
    const startRow = sheet.getLastRow() + 1;
    sheet
      .getRange(startRow, 1, newEmails.length, newEmails[0].length)
      .setValues(newEmails);

    // Format the date column (skip if sheet is a table)
    try {
      const dateCol = columnMap[EMAIL_DATE] + 1; // Convert to 1-based index
      sheet
        .getRange(startRow, dateCol, newEmails.length, 1)
        .setNumberFormat('mm/dd/yyyy');
    } catch (error) {
      // Ignore formatting errors (likely due to Table formatting restrictions)
      Logger.log(
        'Note: Could not format date column (Table formatting may be active)',
      );
    }

    // Auto-resize columns (skip if sheet is a table)
    try {
      sheet.autoResizeColumns(1, Object.keys(columnMap).length);
    } catch (error) {
      // Ignore auto-resize errors (likely due to Table formatting restrictions)
      Logger.log(
        'Note: Could not auto-resize columns (Table formatting may be active)',
      );
    }

    Logger.log(
      `Added ${newEmails.length} new emails to the sheet.`,
    );
  } else {
    Logger.log('No new emails found with the configured label.');
  }
  
  // Record sync activity - manual operations only
  try {
    recordSyncActivity('Email', newEmails.length, 0, 0);
  } catch (error) {
    Logger.log(`Sync activity recording skipped (likely auto-sync): ${error}`);
  }
}