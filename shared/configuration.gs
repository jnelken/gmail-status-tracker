// Configuration management functions

function getConfigValue(spreadsheetId, configLabel) {
  try {
    const configSheet = getOrCreateSheet(spreadsheetId, SHEET_CONFIGURATION);
    const allData = configSheet.getDataRange().getValues();

    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === configLabel) {
        return allData[i][1];
      }
    }

    return null;
  } catch (error) {
    Logger.log(`Error reading config value for ${configLabel}: ${error}`);
    return null;
  }
}

function setConfigValue(spreadsheetId, configLabel, configValue) {
  try {
    const configSheet = getOrCreateSheet(spreadsheetId, SHEET_CONFIGURATION);
    const allData = configSheet.getDataRange().getValues();
    let found = false;

    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === configLabel) {
        configSheet.getRange(i + 1, 2).setValue(configValue);
        found = true;
        break;
      }
    }

    if (!found) {
      const newRow = configSheet.getLastRow() + 1;
      configSheet.getRange(newRow, 1).setValue(configLabel);
      configSheet.getRange(newRow, 2).setValue(configValue);
    }
  } catch (error) {
    Logger.log(`Error setting config value for ${configLabel}: ${error}`);
  }
}

function initializeConfigurationSheet(spreadsheetId) {
  let configSheet = getOrCreateSheet(spreadsheetId, SHEET_CONFIGURATION);

  if (configSheet.getLastRow() === 0) {
    const headers = ['Config Label', 'Config Value'];
    configSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    configSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    configSheet.setFrozenRows(1);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    const configData = [
      [CONFIG_DATE_RANGE_FROM, oneWeekAgo.toISOString().split('T')[0]],
      [CONFIG_DATE_RANGE_TO, twoWeeksFromNow.toISOString().split('T')[0]],
    ];

    configSheet.getRange(2, 1, configData.length, 2).setValues(configData);
  }
}

function getConfigDates(spreadsheetId) {
  try {
    const configSheet = getOrCreateSheet(spreadsheetId, SHEET_CONFIGURATION);
    const allData = configSheet.getDataRange().getValues();
    let fromDate = null;
    let toDate = null;

    for (let i = 1; i < allData.length; i++) {
      const label = allData[i][0]; // Config Label column
      const value = allData[i][1]; // Config Value column

      if (label === CONFIG_DATE_RANGE_FROM && value) {
        fromDate = new Date(value);
      }
      if (label === CONFIG_DATE_RANGE_TO && value) {
        toDate = new Date(value);
      }
    }

    if (!fromDate || !toDate) {
      const defaultFrom = new Date();
      defaultFrom.setDate(defaultFrom.getDate() - 7);
      const defaultTo = new Date();
      defaultTo.setDate(defaultTo.getDate() + 14);
      return { fromDate: defaultFrom, toDate: defaultTo };
    }

    return { fromDate, toDate };
  } catch (error) {
    Logger.log(`Error reading config dates: ${error}`);
    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 7);
    const defaultTo = new Date();
    defaultTo.setDate(defaultTo.getDate() + 14);
    return { fromDate: defaultFrom, toDate: defaultTo };
  }
}