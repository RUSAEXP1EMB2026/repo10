function recordSensorData() {
  const now = new Date();
  const hour = now.getHours();
  // 22時〜9時だけ実行
  if (hour < 22 && hour >= 9) {
    return; // 9〜22時は何もしない
  }
  const deviceData = getNatureRemoData("devices");　　　　//data取得
  const lastSensorData = getLastData("sensor");　　　　　//最終data取得

  var arg = {
    te:deviceData[0].newest_events.te.val,　　//温度
    hu:deviceData[0].newest_events.hu.val,　　//湿度
    il:deviceData[0].newest_events.il.val,　　//照度
  }

  setSensorData(arg, lastSensorData + 1);
}

function setSensorData(data, row) {
  getSheet('sensor').getRange(row, 1, 1, 4).setValues([[new Date(), data.te, data.hu, data.il]])
}
function getSheet(name) {
  const SPREADSHEET_ID = '1czsCsQTLGVql6AaLEo7vO9D52kxxSmSskbSzyCPXACY'
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(name);

  if (!sheet) {
    throw new Error('シートが見つかりません');
  }

  return sheet;
}

function getLastData(name) {
  return getSheet(name).getDataRange().getValues().length;
}
function getNatureRemoData(endpoint) {
  const REMO_ACCESS_TOKEN = 'ory_at_zfmTJpSj2ewpBp_dc7SPTMU-XpDATRrDyFQS4EMTYCk.LM54kafGy0phwDzetQNYX4bwEmC2RTCjjmNRaNX6mos'
  const headers = {
    "Content-Type" : "application/json;",
    'Authorization': 'Bearer ' + REMO_ACCESS_TOKEN,
  };

  const options = {
    "method" : "get",
    "headers" : headers,
  };

  return JSON.parse(UrlFetchApp.fetch("https://api.nature.global/1/" + endpoint, options));
}