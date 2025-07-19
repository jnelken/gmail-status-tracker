// Email deduplication functions

function deduplicateEmailSheet() {
  try {
    const sheet = getOrCreateSheet(SPREADSHEET_ID, SHEET_EMAILS);
    const columnMap = getColumnMap(sheet);

    // Debug: Log all detected column headers
    Logger.log('Detected column headers:');
    Object.keys(columnMap).forEach(header => {
      Logger.log(`  "${header}" at index ${columnMap[header]}`);
    });

    if (columnMap[EMAIL_THREAD_ID] === undefined) {
      Logger.log('Thread ID column not found. Cannot deduplicate.');
      Logger.log('Available columns: ' + Object.keys(columnMap).join(', '));
      return;
    }

    Logger.log(`Thread ID column found at index: ${columnMap[EMAIL_THREAD_ID]}`);
    Logger.log('Proceeding with deduplication...');

    const allData = sheet.getDataRange().getValues();
    const originalRowCount = allData.length - 1; // Exclude header

    Logger.log(
      `Starting deduplication. Original row count: ${originalRowCount}`,
    );

    // Group rows by Thread ID
    const threadGroups = {};
    const threadIdCol = columnMap[EMAIL_THREAD_ID];

    for (let i = 1; i < allData.length; i++) {
      // Skip header row
      const row = allData[i];
      const threadId = row[threadIdCol];

      if (!isBlankField(threadId)) {
        if (!threadGroups[threadId]) {
          threadGroups[threadId] = [];
        }
        threadGroups[threadId].push({
          rowIndex: i,
          data: row,
        });
      }
    }

    // Find duplicates and prepare deduplication
    const rowsToDelete = [];
    const rowsToUpdate = [];
    let duplicateCount = 0;

    for (const threadId in threadGroups) {
      const group = threadGroups[threadId];

      if (group.length > 1) {
        duplicateCount += group.length - 1;

        // Sort by row index (lower index = higher up in sheet)
        group.sort((a, b) => a.rowIndex - b.rowIndex);

        // Keep the row with highest index (furthest down)
        const rowToKeep = group[group.length - 1];
        const rowsToRemove = group.slice(0, -1);

        // Get Status from the lowest index (highest up)
        const statusFromTop = group[0].data[columnMap[EMAIL_STATUS]] || '';

        // Merge data: use kept row but preserve Status from top
        const mergedData = [...rowToKeep.data];
        if (columnMap[EMAIL_STATUS] !== undefined) {
          mergedData[columnMap[EMAIL_STATUS]] = statusFromTop;
        }

        // Fill any empty fields from other duplicates
        for (const duplicate of rowsToRemove) {
          for (let colIndex = 0; colIndex < mergedData.length; colIndex++) {
            if (
              isBlankField(mergedData[colIndex]) &&
              !isBlankField(duplicate.data[colIndex])
            ) {
              mergedData[colIndex] = duplicate.data[colIndex];
            }
          }
        }

        // Schedule update for the kept row
        rowsToUpdate.push({
          rowIndex: rowToKeep.rowIndex + 1, // Convert to 1-based
          data: mergedData,
        });

        // Schedule deletion for duplicate rows (in reverse order to maintain indices)
        for (const duplicate of rowsToRemove) {
          rowsToDelete.push(duplicate.rowIndex + 1); // Convert to 1-based
        }
      }
    }

    if (duplicateCount === 0) {
      Logger.log('No duplicates found. Sheet is already clean.');
      return;
    }

    Logger.log(`Found ${duplicateCount} duplicate rows to remove.`);

    // Update merged rows first
    rowsToUpdate.forEach(update => {
      for (let colIndex = 0; colIndex < update.data.length; colIndex++) {
        sheet
          .getRange(update.rowIndex, colIndex + 1)
          .setValue(update.data[colIndex]);
      }
    });

    // Delete duplicate rows (in reverse order to maintain indices)
    rowsToDelete.sort((a, b) => b - a);
    rowsToDelete.forEach(rowIndex => {
      sheet.deleteRow(rowIndex);
    });

    const finalRowCount = sheet.getLastRow() - 1; // Exclude header
    Logger.log(`Deduplication complete. Final row count: ${finalRowCount}`);
    Logger.log(`Removed ${duplicateCount} duplicate rows.`);
  } catch (error) {
    Logger.log(`Error during deduplication: ${error}`);
  }
}