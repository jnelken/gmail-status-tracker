// Cross-reference calendar events with emails

function updateLastScheduledColumn() {
  const emailSheet = getOrCreateSheet(SPREADSHEET_ID, SHEET_EMAILS);
  const calendarSheet = getOrCreateSheet(SPREADSHEET_ID, SHEET_CALENDAR_EVENTS);

  const emailColumnMap = getColumnMap(emailSheet);
  const calendarColumnMap = getColumnMap(calendarSheet);

  if (!emailColumnMap['Last Scheduled'] || !emailColumnMap[EMAIL_COMPANY]) {
    Logger.log('Missing required columns in Emails sheet');
    return;
  }

  if (
    !calendarColumnMap[CALENDAR_COMPANY] ||
    !calendarColumnMap[CALENDAR_DATE] ||
    !calendarColumnMap[CALENDAR_START_TIME]
  ) {
    Logger.log('Missing required columns in Calendar Events sheet');
    return;
  }

  const emailData = emailSheet.getDataRange().getValues();
  const calendarData = calendarSheet.getDataRange().getValues();

  for (let i = 1; i < emailData.length; i++) {
    const emailRow = emailData[i];
    const company = emailRow[emailColumnMap[EMAIL_COMPANY]];
    const recruitingFirm = emailColumnMap['Recruiting Firm']
      ? emailRow[emailColumnMap['Recruiting Firm']]
      : '';

    if (!company) continue;

    let latestMeeting = null;

    for (let j = 1; j < calendarData.length; j++) {
      const calendarRow = calendarData[j];
      const eventCompany = calendarRow[calendarColumnMap[CALENDAR_COMPANY]];
      const eventDate = calendarRow[calendarColumnMap[CALENDAR_DATE]];

      if (!eventCompany || !eventDate) continue;

      let matches = false;
      if (
        recruitingFirm &&
        eventCompany.toLowerCase() === recruitingFirm.toLowerCase()
      ) {
        matches = true;
      } else if (eventCompany.toLowerCase() === company.toLowerCase()) {
        matches = true;
      }

      if (matches) {
        const meetingDateTime = new Date(eventDate);
        if (!latestMeeting || meetingDateTime > latestMeeting) {
          latestMeeting = meetingDateTime;
        }
      }
    }

    if (latestMeeting) {
      const formattedDate = Utilities.formatDate(
        latestMeeting,
        Session.getScriptTimeZone(),
        'MM/dd/yyyy',
      );
      emailSheet
        .getRange(i + 1, emailColumnMap['Last Scheduled'] + 1)
        .setValue(formattedDate);
    }
  }

  Logger.log('Updated Last Scheduled column for emails');
}