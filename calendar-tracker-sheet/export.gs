// Main calendar event export function

function exportCalendarEvents() {
  let sheet = getOrCreateSheet(SPREADSHEET_ID, SHEET_CALENDAR_EVENTS);

  if (sheet.getLastRow() === 0) {
    const headers = getCalendarHeaders();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  // Initialize configuration sheet
  initializeConfigurationSheet(SPREADSHEET_ID);

  const columnMap = getColumnMap(sheet);
  const { fromDate, toDate } = getConfigDates(SPREADSHEET_ID);

  const existingData = sheet.getDataRange().getValues();
  const eventIdCol = columnMap[CALENDAR_EVENT_ID];
  const existingEventIds = new Set(
    existingData
      .slice(1)
      .map(row => row[eventIdCol])
      .filter(id => id),
  );

  const calendar = CalendarApp.getDefaultCalendar();
  const events = calendar.getEvents(fromDate, toDate);

  // Backfill blank fields for existing events
  backfillBlankFields(sheet, columnMap, events);

  const newEvents = [];

  events.forEach(event => {
    const eventId = event.getId();

    if (existingEventIds.has(eventId)) {
      return;
    }

    if (!isOneOffMeeting(event)) {
      return;
    }

    const eventData = parseEventData(event);
    const rowData = new Array(Object.keys(columnMap).length).fill('');

    rowData[columnMap[CALENDAR_EVENT_ID]] = eventData.eventId;
    rowData[columnMap[CALENDAR_DATE]] = eventData.date;
    rowData[columnMap[CALENDAR_START_TIME]] = eventData.startTime;
    rowData[columnMap[CALENDAR_DURATION]] = eventData.duration;
    rowData[columnMap[CALENDAR_TITLE]] = eventData.title;
    rowData[columnMap[CALENDAR_LOCATION]] = eventData.location;
    rowData[columnMap[CALENDAR_ATTENDEES]] = eventData.attendees;
    rowData[columnMap[CALENDAR_ORGANIZER_EMAIL]] = eventData.organizerEmail;
    rowData[columnMap[CALENDAR_ORGANIZER_NAME]] = eventData.organizerName;
    rowData[columnMap[CALENDAR_COMPANY]] = eventData.company;
    rowData[columnMap[CALENDAR_CATEGORY]] = eventData.category;
    rowData[columnMap[CALENDAR_DESCRIPTION]] = eventData.description;

    newEvents.push(rowData);
  });

  if (newEvents.length > 0) {
    const startRow = sheet.getLastRow() + 1;
    sheet
      .getRange(startRow, 1, newEvents.length, newEvents[0].length)
      .setValues(newEvents);

    try {
      const dateCol = columnMap[CALENDAR_DATE] + 1;
      sheet
        .getRange(startRow, dateCol, newEvents.length, 1)
        .setNumberFormat('mm/dd/yyyy');
    } catch (error) {
      Logger.log('Note: Could not format date column');
    }

    try {
      sheet.autoResizeColumns(1, Object.keys(columnMap).length);
    } catch (error) {
      Logger.log('Note: Could not auto-resize columns');
    }

    Logger.log(`Added ${newEvents.length} new calendar events to the sheet.`);
  } else {
    Logger.log('No new calendar events found in the specified date range.');
  }

  updateLastScheduledColumn();
  
  // Record sync activity - manual operations only
  try {
    recordSyncActivity('Calendar', 0, newEvents.length, 0);
  } catch (error) {
    Logger.log(`Sync activity recording skipped (likely auto-sync): ${error}`);
  }
}