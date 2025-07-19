// Calendar event backfill functions

function backfillBlankFields(sheet, columnMap, events) {
  const existingData = sheet.getDataRange().getValues();
  const eventIdCol = columnMap[CALENDAR_EVENT_ID];
  const rowsToUpdate = [];

  // Create a map of event IDs to event objects for quick lookup
  const eventMap = new Map();
  events.forEach(event => {
    eventMap.set(event.getId(), event);
  });

  // Check each existing row for blank fields
  for (let i = 1; i < existingData.length; i++) {
    const row = existingData[i];
    const eventId = row[eventIdCol];

    if (!eventId || !eventMap.has(eventId)) {
      continue; // Skip if no event ID or event not found in current range
    }

    const event = eventMap.get(eventId);
    const eventData = parseEventData(event);
    let hasBlankFields = false;
    const updates = {};

    // Check each field for blank values
    const fieldsToCheck = [
      CALENDAR_COMPANY,
      CALENDAR_CATEGORY,
      CALENDAR_ORGANIZER_NAME,
      CALENDAR_ORGANIZER_EMAIL,
      CALENDAR_DURATION,
      CALENDAR_LOCATION,
    ];

    fieldsToCheck.forEach(fieldName => {
      const colIndex = columnMap[fieldName];
      if (colIndex !== undefined && isBlankField(row[colIndex])) {
        hasBlankFields = true;
        updates[fieldName] = getEventDataField(eventData, fieldName);
      }
    });

    if (hasBlankFields) {
      rowsToUpdate.push({
        rowIndex: i + 1, // Convert to 1-based index
        updates: updates,
      });
    }
  }

  // Apply updates
  rowsToUpdate.forEach(update => {
    Object.keys(update.updates).forEach(fieldName => {
      const colIndex = columnMap[fieldName];
      if (colIndex !== undefined) {
        sheet
          .getRange(update.rowIndex, colIndex + 1)
          .setValue(update.updates[fieldName]);
      }
    });
  });

  if (rowsToUpdate.length > 0) {
    Logger.log(
      `Backfilled blank fields for ${rowsToUpdate.length} existing events`,
    );
  } else {
    Logger.log('No blank fields found to backfill in calendar events');
  }
}

function getEventDataField(eventData, fieldName) {
  const fieldMap = {
    [CALENDAR_COMPANY]: eventData.company,
    [CALENDAR_CATEGORY]: eventData.category,
    [CALENDAR_ORGANIZER_NAME]: eventData.organizerName,
    [CALENDAR_ORGANIZER_EMAIL]: eventData.organizerEmail,
    [CALENDAR_DURATION]: eventData.duration,
    [CALENDAR_LOCATION]: eventData.location,
  };

  return fieldMap[fieldName] || '';
}