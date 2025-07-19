// Trigger management functions

function setupTrigger() {
  // Delete existing triggers for both functions
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (
      trigger.getHandlerFunction() === 'exportStatusTrackerEmails' ||
      trigger.getHandlerFunction() === 'syncAllData' ||
      trigger.getHandlerFunction() === 'scheduledSyncCheck' ||
      trigger.getHandlerFunction() === 'checkForSyncRequests'
    ) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create two daily triggers for regular scheduled sync
  ScriptApp.newTrigger('scheduledSyncCheck')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();

  ScriptApp.newTrigger('scheduledSyncCheck')
    .timeBased()
    .everyDays(1)
    .atHour(14)
    .create();

  // Create frequent trigger for cross-account sync requests (every 5 minutes)
  ScriptApp.newTrigger('checkForSyncRequests')
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log(
    'Triggers set up: Daily sync at 8 AM and 2 PM, plus every 5 minutes check for cross-account sync requests',
  );
}

function removeTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (
      trigger.getHandlerFunction() === 'exportStatusTrackerEmails' ||
      trigger.getHandlerFunction() === 'syncAllData' ||
      trigger.getHandlerFunction() === 'scheduledSyncCheck' ||
      trigger.getHandlerFunction() === 'checkForSyncRequests'
    ) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  Logger.log('All auto-sync triggers removed');
}