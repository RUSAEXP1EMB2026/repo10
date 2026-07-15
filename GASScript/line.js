const CHANNEL_ACCESS_TOKEN = 'm+1KeiJVgEbJHOdM0phK/SUqO4h8m62vfbsCqbEj68KxCpe6jgM+PmcdpL77RG23Ym/kMXStG8+jiSndMCiFibmf5wIRugFiTsThaIS9lxB1TH+OXvBvMl/Jvydy2N0Tqq4KybkG0jUI/UrRgAM3hwdB04t89/1O/w1cDnyilFU=';
const SHEET_ID = '1czsCsQTLGVql6AaLEo7vO9D52kxxSmSskbSzyCPXACY';
const APPS_SCRIPT_SECRET = '';

function doPost(e) {
  const bodyText = e.postData && e.postData.contents ? e.postData.contents : '';
  let json;
  try {
    json = JSON.parse(bodyText);
  } catch (err) {
    return ContentService.createTextOutput('Invalid JSON');
  }

  const secretHeader = e.headers && (e.headers['x-webapp-secret'] || e.headers['X-WebApp-Secret']);
  const secretBody = json.secret;
  const secret = secretHeader || secretBody || '';

  if (APPS_SCRIPT_SECRET && secret !== APPS_SCRIPT_SECRET) {
    return ContentService.createTextOutput('Invalid secret');
  }

  if (json.userId && json.birthdate && json.region) {
    saveBirthday(json.userId, json.birthdate, json.region);
    return ContentService.createTextOutput('OK');
  }

  if (json.action === 'getFortune') {
    const info = getBirthdayAndRegion(json.userId);
    if (!info) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, reason: 'NotRegistered' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    let { birthday, region } = info;
    if (birthday instanceof Date) {
      birthday = Utilities.formatDate(birthday, Session.getScriptTimeZone(), "yyyy-MM-dd");
    } else {
      birthday = String(birthday);
    }
    const [year, month, day] = birthday.split("-").map(Number);
    const eto = getZodiacAnimal(year);
    const seiza = getHoroscope(month, day);

    const ranking = generateRanking();
    const A = calcA();
    const B = calcB();
    const averages = getSensorAverages();
    const sleepHours = getSleepHours();
    const C = calcC(sleepHours);

    // 降水確率の取得（API呼び出しを1回に最適化し、エラーをハンドリング）
    let rainP = null;
    try {
      rainP = getRainProbability(region);
    } catch (e) {
      Logger.log("Failed to get rain probability: " + e);
    }

    const D = (rainP != null) ? (100 - rainP) / 100 : null;
    const H = calcH(A, B, C, D);

    const luckyItem = getLuckyItem(averages.avgTmp, averages.avgHum, sleepHours, rainP != null ? rainP : 30);
    const advice = generateAdvice(averages.avgTmp, averages.avgHum, sleepHours, rainP != null ? rainP : 30);

    const responseData = {
      success: true,
      birthday: birthday,
      region: region,
      eto: eto,
      seiza: seiza,
      overallRank: ranking.overallRank,
      zodiacRank: ranking.zodiacRank,
      constellationRank: ranking.constellationRank,
      fortuneScore: (A * 100).toFixed(1),
      avgTmp: averages.avgTmp != null ? averages.avgTmp.toFixed(1) : '取得失敗',
      avgHum: averages.avgHum != null ? averages.avgHum.toFixed(1) : '取得失敗',
      sleepHours: sleepHours != null ? sleepHours.toFixed(1) : '取得失敗',
      happiness: (H * 100).toFixed(1),
      luckyItem: luckyItem,
      advice: advice,
      rainP: rainP != null ? rainP.toFixed(0) : '取得失敗',
      geminiError: lastGeminiError
    };

    return ContentService.createTextOutput(JSON.stringify(responseData))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const event = json.events && json.events[0];
  if (!event) {
    return ContentService.createTextOutput('Unsupported payload');
  }
  const userId = event.source.userId;

  // ① followイベント（初回案内）
  if (event.type === 'follow') {
    const userId = event.source.userId;
    sendPush(userId, 'こんにちは！生年月日を入力してください（例：2001-07-01）');
    return ContentService.createTextOutput('OK');
  }


  // ② メッセージ受信
  if (event.type === 'message' && event.message.type === 'text') {
    const userText = event.message.text.trim();

    // 生年月日未登録なら案内
    const birthday = getBirthday(userId);
    if (!birthday && !/^\d{4}-\d{2}-\d{2}$/.test(userText)) {
      replyText(event.replyToken, '生年月日を入力してください（例：2001-07-01）');
      return ContentService.createTextOutput('OK');
    }

    // 生年月日登録（初回のみ）
    if (/^\d{4}-\d{2}-\d{2}$/.test(userText)) {
      if (!birthday) {
        saveBirthday(userId, userText);
        replyText(event.replyToken, '登録完了！次回から「占い結果」で結果が見られます✨');
      } else {
        replyText(event.replyToken, 'すでに登録済みです！「占い結果」と送ってください✨');
      }
      return ContentService.createTextOutput('OK');
    }

    // 占い結果
    if (userText === '占い結果') {

      // A: ランキング
      const ranking = generateRanking();
      const A = calcA();

      const rankingText =
        `【今日のランキング】\n` +
        `干支順位: ${ranking.zodiacRank}\n` +
        `星座順位: ${ranking.constellationRank}\n` +
        `総合順位: ${ranking.overallRank} 位\n` +
        `運勢スコア(A): ${(A * 100).toFixed(1)}%`;

      replyText(event.replyToken, rankingText);

      // B: センサー平均値
      const avg = getSensorAverages();
      const sleepHours = getSleepHours() || 7;
      const region = "関東";
      const rainP = getRainProbability(region);

      // C: ラッキーアイテム
      const luckyItem = getLuckyItem(avg.avgTmp, avg.avgHum, sleepHours, rainP);
      sendPush(userId, `【ラッキーアイテム】\n${luckyItem}`);

      // D: アドバイス
      const advice = generateAdvice(avg.avgTmp, avg.avgHum, sleepHours, rainP);
      sendPush(userId, `【今日のアドバイス】\n${advice}`);

      return ContentService.createTextOutput('OK');
    }

    // その他はオウム返し
    replyText(event.replyToken, userText);
  }

  return ContentService.createTextOutput('OK');
}

// reply API
function replyText(replyToken, text) {
  UrlFetchApp.fetch("https://api.line.me/v2/bot/message/reply", {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN
    },
    payload: JSON.stringify({
      replyToken: replyToken,
      messages: [{ type: "text", text: text }]
    })
  });
}

// push API
function sendPush(userId, text) {
  UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
    method: "post",
    headers: { "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN },
    contentType: "application/json",
    payload: JSON.stringify({
      to: userId,
      messages: [{ type: "text", text: text }]
    })
  });
}

// 生年月日保存
function saveBirthday(userId, birthday, region) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('birthday');
  if (!sheet) {
    throw new Error('birthday シートが見つかりません');
  }

  // すでに登録されている場合は更新、なければ新規追加
  const data = sheet.getDataRange().getValues();
  let foundRow = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === userId) {
      foundRow = i + 1; // 1-indexed
      break;
    }
  }

  if (foundRow !== -1) {
    sheet.getRange(foundRow, 2).setValue(birthday); // B列
    sheet.getRange(foundRow, 3).setValue(region || ''); // C列
  } else {
    const lastRow = sheet.getLastRow() + 1;
    sheet.getRange(lastRow, 1).setValue(userId); // A列: userId
    sheet.getRange(lastRow, 2).setValue(birthday); // B列: birthday
    sheet.getRange(lastRow, 3).setValue(region || ''); // C列: region
  }
}

// 生年月日・地域取得
function getBirthdayAndRegion(userId) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('birthday');
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === userId) {
      return {
        birthday: data[i][1],
        region: data[i][2] || '関東'
      };
    }
  }
  return null;
}

// 生年月日取得
function getBirthday(userId) {
  const info = getBirthdayAndRegion(userId);
  return info ? info.birthday : null;
}
