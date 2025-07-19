// Column name constants for email tracking
const EMAIL_DATE = 'Date';
const EMAIL_COMPANY = 'Company';
const EMAIL_SENDER_NAME = 'Sender Name';
const EMAIL_SENDER_EMAIL = 'Sender Email';
const EMAIL_SUBJECT = 'Subject';
const EMAIL_SNIPPET = 'Email Snippet';
const EMAIL_STATUS = 'Status';
const EMAIL_THREAD_ID = 'Thread ID';
const EMAIL_ACCOUNT = 'Account';
const EMAIL_VERSION = 'Version';
const EMAIL_SENT_ON = 'Sent On';

// status value for ignored emails
const EMAIL_STATUS_IGNORE_VALUE = 'Ignore';

// Column name constants for calendar events
const CALENDAR_EVENT_ID = 'Event ID';
const CALENDAR_DATE = 'Date';
const CALENDAR_START_TIME = 'Start Time';
const CALENDAR_DURATION = 'Duration';
const CALENDAR_TITLE = 'Title';
const CALENDAR_LOCATION = 'Location';
const CALENDAR_ATTENDEES = 'Attendees';
const CALENDAR_ORGANIZER_EMAIL = 'Organizer Email';
const CALENDAR_ORGANIZER_NAME = 'Organizer Name';
const CALENDAR_COMPANY = 'Company';
const CALENDAR_CATEGORY = 'Category';
const CALENDAR_DESCRIPTION = 'Description';

// Configuration constants
const CONFIG_DATE_RANGE_FROM = 'Date Range From';
const CONFIG_DATE_RANGE_TO = 'Date Range To';
const CONFIG_SYNC_REQUEST = 'Sync Request';

// Sync activity constants
const SYNC_TIMESTAMP = 'Timestamp';
const SYNC_ACCOUNT = 'Account';
const SYNC_TYPE = 'Sync Type';
const SYNC_EMAILS_ADDED = 'Emails Added';
const SYNC_EVENTS_ADDED = 'Events Added';
const SYNC_BACKFILLS_UPDATED = 'Backfills Updated';

// Sheet names
const SHEET_EMAILS = 'Emails';
const SHEET_CALENDAR_EVENTS = 'Events';
const SHEET_CONFIGURATION = 'Configuration';
const SHEET_SYNC_ACTIVITY = 'Sync Activity';
const SHEET_IGNORED_EMAILS = 'Ignored Emails';

// Email headers array for easy reference
function getEmailHeaders() {
  return [
    EMAIL_DATE,
    EMAIL_COMPANY,
    EMAIL_SENDER_NAME,
    EMAIL_SENDER_EMAIL,
    EMAIL_SUBJECT,
    EMAIL_SNIPPET,
    EMAIL_STATUS,
    EMAIL_THREAD_ID,
    EMAIL_ACCOUNT,
    EMAIL_VERSION,
    EMAIL_SENT_ON,
  ];
}

// Calendar headers array for easy reference
function getCalendarHeaders() {
  return [
    CALENDAR_EVENT_ID,
    CALENDAR_DATE,
    CALENDAR_START_TIME,
    CALENDAR_DURATION,
    CALENDAR_TITLE,
    CALENDAR_LOCATION,
    CALENDAR_ATTENDEES,
    CALENDAR_ORGANIZER_EMAIL,
    CALENDAR_ORGANIZER_NAME,
    CALENDAR_COMPANY,
    CALENDAR_CATEGORY,
    CALENDAR_DESCRIPTION,
  ];
}

// Sync activity headers array for easy reference
function getSyncActivityHeaders() {
  return [
    SYNC_TIMESTAMP,
    SYNC_ACCOUNT,
    SYNC_TYPE,
    SYNC_EMAILS_ADDED,
    SYNC_EVENTS_ADDED,
    SYNC_BACKFILLS_UPDATED,
  ];
}
