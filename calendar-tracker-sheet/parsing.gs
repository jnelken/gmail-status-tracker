// Calendar event parsing and categorization functions

function parseEventData(event) {
  const startTime = event.getStartTime();
  const endTime = event.getEndTime();
  const organizerEmail = event.getCreators()[0] || '';
  const guestList = event.getGuestList();

  return {
    eventId: event.getId(),
    date: startTime,
    startTime: formatTime(startTime),
    duration: calculateDuration(startTime, endTime),
    title: event.getTitle(),
    location: event.getLocation() || '',
    attendees: guestList.map(guest => guest.getEmail()).join(', '),
    organizerEmail: organizerEmail,
    organizerName: extractNameFromEmail(organizerEmail),
    company: extractCompanyFromEmailOrAttendees(organizerEmail, guestList),
    category: categorizeEvent(event.getTitle()),
    description: event.getDescription() || '',
  };
}

function calculateDuration(startTime, endTime) {
  const diffMs = endTime.getTime() - startTime.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (diffMinutes === 0) {
    return 'All day';
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours === 0) {
    return `${minutes} minutes`;
  } else if (minutes === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  } else {
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minutes`;
  }
}

function formatTime(dateTime) {
  return Utilities.formatDate(dateTime, Session.getScriptTimeZone(), 'HH:mm');
}

function extractCompanyFromEmail(email) {
  if (!email) return '';

  const domain = email.split('@')[1];
  if (!domain) return '';

  return domain;
}

function extractCompanyFromEmailOrAttendees(organizerEmail, guestList) {
  if (!organizerEmail) return '';

  const organizerDomain = organizerEmail.split('@')[1];

  if (organizerDomain && organizerDomain.toLowerCase() !== 'gmail.com') {
    return extractCompanyFromEmail(organizerEmail);
  }

  for (const guest of guestList) {
    const guestEmail = guest.getEmail();
    const guestDomain = guestEmail.split('@')[1];

    if (guestDomain && guestDomain.toLowerCase() !== 'gmail.com') {
      return extractCompanyFromEmail(guestEmail);
    }
  }

  return extractCompanyFromEmail(organizerEmail);
}

function extractNameFromEmail(email) {
  if (!email) return '';

  const nameMatch = email.match(/^(.+?)@/);
  if (nameMatch) {
    return nameMatch[1]
      .replace(/[._]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return '';
}

function categorizeEvent(title) {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes('interview') || lowerTitle.includes('screening')) {
    return 'Interview';
  }
  if (lowerTitle.includes('phone') || lowerTitle.includes('call')) {
    return 'Phone Call';
  }
  if (lowerTitle.includes('on-site') || lowerTitle.includes('onsite')) {
    return 'On-site';
  }
  if (lowerTitle.includes('follow-up') || lowerTitle.includes('followup')) {
    return 'Follow-up';
  }
  if (
    lowerTitle.includes('meeting') ||
    lowerTitle.includes('chat') ||
    lowerTitle.includes('coffee')
  ) {
    return 'Meeting';
  }

  return '';
}

function isOneOffMeeting(event) {
  if (event.isRecurringEvent()) {
    return false;
  }

  if (event.isAllDayEvent()) {
    return false;
  }

  return true;
}