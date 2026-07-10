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
  detectBrightnessDropNight();//記録後に明るさの差を調べる
  detectBrightnessRiseMorning();
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
function detectBrightnessDropNight() {
  const sheet = getSheet('sensor');
  const data = sheet.getDataRange().getValues();

  if (data.length < 3) return;

  const rows = data.slice(1);
  const lastRowIndex = rows.length;

  const last = rows[lastRowIndex - 1];
  const prev = rows[lastRowIndex - 2];

  const briNow = last[3];
  const briPrev = prev[3];

  const drop = briPrev - briNow;
  const THRESHOLD = 50;
  const dropFlagColumn = 5;

  const flag = drop >= THRESHOLD ? 1 : 0;

  sheet.getRange(lastRowIndex + 1, dropFlagColumn).setValue(flag);
}
function detectBrightnessRiseMorning() {
  const sheet = getSheet('sensor');
  const data = sheet.getDataRange().getValues();

  if (data.length < 3) return;

  const rows = data.slice(1);
  const lastRowIndex = rows.length;

  const last = rows[lastRowIndex - 1];
  const prev = rows[lastRowIndex - 2];

  const briNow = last[3];
  const briPrev = prev[3];

  const rise = briNow - briPrev;
  const THRESHOLD = 50;
  const wakeFlagColumn = 6;  // 起床フラグ用の新しい列（6列目）

  const flag = rise >= THRESHOLD ? 1 : 0;

  sheet.getRange(lastRowIndex + 1, wakeFlagColumn).setValue(flag);
}