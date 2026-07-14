const CHANNEL_ACCESS_TOKEN = 'm+1KeiJVgEbJHOdM0phK/SUqO4h8m62vfbsCqbEj68KxCpe6jgM+PmcdpL77RG23Ym/kMXStG8+jiSndMCiFibmf5wIRugFiTsThaIS9lxB1TH+OXvBvMl/Jvydy2N0Tqq4KybkG0jUI/UrRgAM3hwdB04t89/1O/w1cDnyilFU=';
const SHEET_ID = '1czsCsQTLGVql6AaLEo7vO9D52kxxSmSskbSzyCPXACY';

function doPost(e) {
  const json = JSON.parse(e.postData.contents);
  const event = json.events[0];
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
function saveBirthday(userId, birthday) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('birthday');
  sheet.appendRow([userId, birthday]);
}

// 生年月日取得
function getBirthday(userId) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('birthday');
  const data = sheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === userId) return data[i][1];
  }
  return null;
}
