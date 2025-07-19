// Backfill functions for email data

function backfillSenderEmails(sheet, columnMap) {
  // Check if required columns exist
  if (
    !columnMap[EMAIL_SENDER_NAME] ||
    !columnMap[EMAIL_SENDER_EMAIL] ||
    !columnMap[EMAIL_THREAD_ID]
  ) {
    return; // Skip if columns don't exist
  }

  const senderNameCol = columnMap[EMAIL_SENDER_NAME];
  const senderEmailCol = columnMap[EMAIL_SENDER_EMAIL];
  const companyCol = columnMap[EMAIL_COMPANY];
  const accountCol = columnMap[EMAIL_ACCOUNT];
  const threadIdCol = columnMap[EMAIL_THREAD_ID];
  const allData = sheet.getDataRange().getValues();

  // Get ignored thread IDs to skip processing
  const ignoredThreadIds = getIgnoredThreadIds();

  // Find rows with Thread ID but missing Sender Name, Email, Company, or Account
  const rowsToUpdate = [];
  let totalRowsChecked = 0;
  let rowsWithThreadId = 0;
  let rowsNeedingUpdate = 0;

  Logger.log(`Starting backfill check for ${allData.length - 1} data rows`);

  for (let i = 1; i < allData.length; i++) {
    // Skip header row
    const row = allData[i];
    const threadId = row[threadIdCol];
    const senderName = row[senderNameCol];
    const senderEmail = row[senderEmailCol];
    const company = companyCol !== undefined ? row[companyCol] : null;
    const account = accountCol !== undefined ? row[accountCol] : null;

    totalRowsChecked++;

    if (!isBlankField(threadId)) {
      rowsWithThreadId++;
      Logger.log(
        `Row ${
          i + 1
        }: Thread ID "${threadId}", Name: "${senderName}", Email: "${senderEmail}", Company: "${company}", Account: "${account}"`,
      );
    }

    // Skip if this thread ID is in the ignored list
    if (!isBlankField(threadId) && ignoredThreadIds.has(threadId)) {
      Logger.log(`Row ${i + 1}: Skipping ignored thread ID "${threadId}"`);
      continue;
    }

    // Check for any blank fields that we can backfill
    const fieldsToCheck = {
      [EMAIL_SENDER_NAME]: senderName,
      [EMAIL_SENDER_EMAIL]: senderEmail,
    };
    
    if (companyCol !== undefined) {
      fieldsToCheck[EMAIL_COMPANY] = company;
    }
    if (accountCol !== undefined) {
      fieldsToCheck[EMAIL_ACCOUNT] = account;
    }
    
    fieldsToCheck[EMAIL_DATE] = row[columnMap[EMAIL_DATE]];
    fieldsToCheck[EMAIL_SUBJECT] = row[columnMap[EMAIL_SUBJECT]];
    fieldsToCheck[EMAIL_SNIPPET] = row[columnMap[EMAIL_SNIPPET]];

    const hasBlankFields =
      !isBlankField(threadId) && hasBlankFieldsInObject(fieldsToCheck);

    if (hasBlankFields) {
      rowsNeedingUpdate++;
      Logger.log(`Row ${i + 1} needs update - Thread ID: ${threadId}`);

      // Find the email thread and extract sender
      // Note: This will only work if the current account has access to this thread
      try {
        const threads = GmailApp.search(`label:${GMAIL_LABEL}`, 0, 500);
        Logger.log(
          `  Found ${threads.length} threads in current account's Gmail with configured label`,
        );
        const matchingThread = threads.find(t => t.getId() === threadId);
        Logger.log(`  Looking for thread ID: ${threadId}`);

        if (matchingThread) {
          Logger.log(`  ✓ Thread found! Extracting data...`);
          const messages = matchingThread.getMessages();
          const sender = messages[0].getFrom();
          const recipient = messages[0].getTo();
          const subject = messages[0].getSubject();
          const { name, email } = parseSender(sender);
          const { email: recipientEmail } = parseSender(recipient);
          const company = extractCompanyName(sender, subject);

          Logger.log(
            `  Extracted: Name="${name}", Email="${email}", Company="${company}", Account="${recipientEmail}"`,
          );

          // Prepare complete row data for backfill
          const firstMessage = messages[0];
          const date = firstMessage.getDate();
          const body = firstMessage.getPlainBody();
          const snippet =
            body.substring(0, 400).replace(/\n/g, ' ').trim() + '...';

          rowsToUpdate.push({
            row: i + 1, // Convert to 1-based index
            name: name,
            email: email,
            company: company,
            account: recipientEmail,
            date: date,
            subject: subject,
            snippet: snippet,
          });
        } else {
          Logger.log(
            `  ✗ Thread ${threadId} not found in current account's Gmail - may belong to different account`,
          );
        }
      } catch (error) {
        Logger.log(
          `Could not backfill sender for thread ${threadId}: ${error}`,
        );
      }
    }
  }

  // Update rows with missing sender data and all other blank fields
  rowsToUpdate.forEach(update => {
    try {
      // Update all available fields if they're blank
      const currentRowData = allData[update.row - 1];
      const fieldsToUpdate = {};
      
      // Define columns that can be backfilled and their corresponding update values
      const backfillableFields = {
        [EMAIL_SENDER_NAME]: update.name,
        [EMAIL_SENDER_EMAIL]: update.email,
        [EMAIL_COMPANY]: update.company,
        [EMAIL_ACCOUNT]: update.account,
        [EMAIL_DATE]: update.date,
        [EMAIL_SUBJECT]: update.subject,
        [EMAIL_SNIPPET]: update.snippet,
        [EMAIL_SENT_ON]: update.date
      };
      
      // Build fieldsToUpdate object programmatically
      for (const columnName of Object.keys(backfillableFields)) {
        if (columnMap[columnName] !== undefined) {
          fieldsToUpdate[columnName] = currentRowData[columnMap[columnName]];
        }
      }
      
      // Check which fields are blank and update them programmatically
      if (hasBlankFieldsInObject(fieldsToUpdate)) {
        for (const [columnName, newValue] of Object.entries(backfillableFields)) {
          if (columnMap[columnName] !== undefined && isBlankField(fieldsToUpdate[columnName])) {
            sheet.getRange(update.row, columnMap[columnName] + 1).setValue(newValue);
          }
        }
      }
      if (columnMap[EMAIL_VERSION] !== undefined) {
        sheet
          .getRange(update.row, columnMap[EMAIL_VERSION] + 1)
          .setValue(getCurrentVersion());
      }
    } catch (error) {
      Logger.log(`Could not update row ${update.row}: ${error}`);
    }
  });

  Logger.log(`Backfill summary:`);
  Logger.log(`  Total rows checked: ${totalRowsChecked}`);
  Logger.log(`  Rows with Thread ID: ${rowsWithThreadId}`);
  Logger.log(`  Rows needing update: ${rowsNeedingUpdate}`);
  Logger.log(`  Rows actually updated: ${rowsToUpdate.length}`);

  if (rowsToUpdate.length > 0) {
    Logger.log(`Backfilled sender data for ${rowsToUpdate.length} rows`);
  } else {
    Logger.log('No blank fields found to backfill in email data');
  }
}

function backfillFromGmail() {
  try {
    Logger.log('Starting backfill from Gmail - processing ALL labeled emails');

    let sheet = getOrCreateSheet(SPREADSHEET_ID, SHEET_EMAILS);

    // Set up headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      const headers = getEmailHeaders();
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    const columnMap = getColumnMap(sheet);

    // Get existing thread IDs to avoid duplicates
    const existingData = sheet.getDataRange().getValues();
    const threadIdCol = columnMap[EMAIL_THREAD_ID];
    const existingThreadIds = new Set(
      existingData
        .slice(1)
        .map(row => row[threadIdCol])
        .filter(id => id),
    );

    // Get ignored thread IDs to skip processing
    const ignoredThreadIds = getIgnoredThreadIds();

    Logger.log(`Found ${existingThreadIds.size} existing Thread IDs in sheet`);
    Logger.log(`Found ${ignoredThreadIds.size} ignored Thread IDs to skip`);

    // Search for ALL emails with the configured label (ignoring existing ones)
    const threads = GmailApp.search(`label:${GMAIL_LABEL}`, 0, 500);
    Logger.log(
      `Found ${threads.length} total threads with configured label in Gmail`,
    );

    const newEmails = [];
    let skippedCount = 0;

    threads.forEach(thread => {
      const threadId = thread.getId();

      // Skip if this thread ID is in the ignored list
      if (ignoredThreadIds.has(threadId)) {
        Logger.log(`Skipping ignored thread ID: ${threadId}`);
        return;
      }

      // Check if this thread exists in the sheet
      if (existingThreadIds.has(threadId)) {
        skippedCount++;
        // For existing threads, check if we need to backfill any empty values
        const existingRowIndex = existingData.findIndex((row, index) => 
          index > 0 && row[threadIdCol] === threadId
        );
        
        if (existingRowIndex > 0) {
          const existingRow = existingData[existingRowIndex];
          
          // Check if any required fields are blank
          const fieldsToCheck = {
            [EMAIL_DATE]: existingRow[columnMap[EMAIL_DATE]],
            [EMAIL_COMPANY]: columnMap[EMAIL_COMPANY] !== undefined ? existingRow[columnMap[EMAIL_COMPANY]] : 'N/A',
            [EMAIL_SENDER_NAME]: existingRow[columnMap[EMAIL_SENDER_NAME]],
            [EMAIL_SENDER_EMAIL]: existingRow[columnMap[EMAIL_SENDER_EMAIL]],
            [EMAIL_SUBJECT]: existingRow[columnMap[EMAIL_SUBJECT]],
            [EMAIL_SNIPPET]: existingRow[columnMap[EMAIL_SNIPPET]],
            [EMAIL_ACCOUNT]: columnMap[EMAIL_ACCOUNT] !== undefined ? existingRow[columnMap[EMAIL_ACCOUNT]] : 'N/A',
            [EMAIL_SENT_ON]: columnMap[EMAIL_SENT_ON] !== undefined ? existingRow[columnMap[EMAIL_SENT_ON]] : 'N/A'
          };
          
          if (hasBlankFieldsInObject(fieldsToCheck)) {
            // Get the first message in the thread
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

            // Update only blank fields in the existing row
            const actualRowIndex = existingRowIndex + 1; // Convert to 1-based index
            
            if (isBlankField(fieldsToCheck[EMAIL_DATE])) {
              sheet.getRange(actualRowIndex, columnMap[EMAIL_DATE] + 1).setValue(date);
            }
            if (columnMap[EMAIL_COMPANY] !== undefined && isBlankField(fieldsToCheck[EMAIL_COMPANY])) {
              sheet.getRange(actualRowIndex, columnMap[EMAIL_COMPANY] + 1).setValue(company);
            }
            if (isBlankField(fieldsToCheck[EMAIL_SENDER_NAME])) {
              sheet.getRange(actualRowIndex, columnMap[EMAIL_SENDER_NAME] + 1).setValue(senderName);
            }
            if (isBlankField(fieldsToCheck[EMAIL_SENDER_EMAIL])) {
              sheet.getRange(actualRowIndex, columnMap[EMAIL_SENDER_EMAIL] + 1).setValue(senderEmail);
            }
            if (isBlankField(fieldsToCheck[EMAIL_SUBJECT])) {
              sheet.getRange(actualRowIndex, columnMap[EMAIL_SUBJECT] + 1).setValue(subject);
            }
            if (isBlankField(fieldsToCheck[EMAIL_SNIPPET])) {
              sheet.getRange(actualRowIndex, columnMap[EMAIL_SNIPPET] + 1).setValue(snippet);
            }
            if (columnMap[EMAIL_ACCOUNT] !== undefined && isBlankField(fieldsToCheck[EMAIL_ACCOUNT])) {
              sheet.getRange(actualRowIndex, columnMap[EMAIL_ACCOUNT] + 1).setValue(recipientEmail);
            }
            if (columnMap[EMAIL_SENT_ON] !== undefined && isBlankField(fieldsToCheck[EMAIL_SENT_ON])) {
              sheet.getRange(actualRowIndex, columnMap[EMAIL_SENT_ON] + 1).setValue(date);
            }
            if (columnMap[EMAIL_VERSION] !== undefined) {
              sheet.getRange(actualRowIndex, columnMap[EMAIL_VERSION] + 1).setValue(getCurrentVersion());
            }
          }
        }
        return;
      }

      // Get the first message in the thread
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

    Logger.log(`Processing results:`);
    Logger.log(`  Total threads in Gmail: ${threads.length}`);
    Logger.log(`  Already in sheet (skipped): ${skippedCount}`);
    Logger.log(`  New emails to add: ${newEmails.length}`);

    // Add new emails to the sheet
    if (newEmails.length > 0) {
      const startRow = sheet.getLastRow() + 1;
      sheet
        .getRange(startRow, 1, newEmails.length, newEmails[0].length)
        .setValues(newEmails);

      // Format the date column
      try {
        const dateCol = columnMap[EMAIL_DATE] + 1;
        sheet
          .getRange(startRow, dateCol, newEmails.length, 1)
          .setNumberFormat('mm/dd/yyyy');
      } catch (error) {
        Logger.log('Note: Could not format date column');
      }

      // Auto-resize columns
      try {
        sheet.autoResizeColumns(1, Object.keys(columnMap).length);
      } catch (error) {
        Logger.log('Note: Could not auto-resize columns');
      }

      Logger.log(
        `✅ Successfully added ${newEmails.length} emails from Gmail backfill`,
      );
    } else {
      Logger.log(
        '✅ No new emails to add - all labeled emails are already in the sheet',
      );
    }
    
    // Record sync activity - manual operations only
    try {
      recordSyncActivity('Email', newEmails.length, 0, rowsToUpdate.length);
    } catch (error) {
      Logger.log(`Sync activity recording skipped (likely auto-sync): ${error}`);
    }
  } catch (error) {
    Logger.log(`Error during Gmail backfill: ${error}`);
  }
}