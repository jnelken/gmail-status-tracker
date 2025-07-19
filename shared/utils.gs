// Shared utility functions

function isBlankField(value) {
  return value === null || value === undefined || value === '';
}

function hasBlankFieldsInObject(fieldsObject) {
  const blankFields = [];
  
  for (const [columnTitle, fieldValue] of Object.entries(fieldsObject)) {
    if (isBlankField(fieldValue)) {
      blankFields.push(columnTitle);
    }
  }
  
  if (blankFields.length > 0) {
    Logger.log(`  Missing fields: ${blankFields.join(', ')}`);
  }
  
  return blankFields.length > 0;
}

function getOrCreateSheet(spreadsheetId, sheetName) {
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  return sheet;
}

function getColumnMap(sheet) {
  // Use a larger range to ensure we capture all columns, including hidden ones
  const maxColumns = sheet.getMaxColumns();
  const headers = sheet.getRange(1, 1, 1, maxColumns).getValues()[0];
  const columnMap = {};

  headers.forEach((header, index) => {
    if (header && header.toString().trim() !== '') {
      columnMap[header.toString().trim()] = index;
    }
  });

  return columnMap;
}

function getCurrentVersion() {
  // Extract version from the menu title in onOpen function
  return 'v2.5.0';
}

function parseSender(sender) {
  const emailMatch = sender.match(/<(.+?)>/);

  if (emailMatch) {
    // Format: "Name <email@domain.com>"
    const name = sender.split('<')[0].trim();
    const email = emailMatch[1];
    return { name, email };
  } else {
    // Format: "email@domain.com" (no name)
    return { name: '', email: sender };
  }
}

function extractCompanyName(sender, subject) {
  const { email } = parseSender(sender);

  const domain = email.split('@')[1];
  if (domain) {
    return domain;
  }

  // Fallback to sender name or subject
  const { name } = parseSender(sender);
  return name || subject;
}