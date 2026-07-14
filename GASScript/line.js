const CHANNEL_ACCESS_TOKEN = 'Ic/kTvd+zTRW9INdRgQeSsfzR0ZMuE2gUO5+gFxHnZk4IkbKBaed7RhS7s24cvloVbjMQqTM8a40kjSAdSYrGhMiJXV+nAdf9SltYcxWzjilVixJvljDUBV5cGsdH8fnNb70G1xEnh4vVWQQGuS+KgdB04t89/1O/w1cDnyilFU=';
const SHEET_ID = '1LP6hXdUgDEO8EastWvRNnCsfBg0yapZvORRiTzrhHZs'; // 生年月日シート

function doPost(e) {
  const json = JSON.parse(e.postData.contents);
  const event = json.events[0];
  const userId = event.source.userId;

  // ① follow（初回のみ案内）
  if (event.type === 'follow') {
    const birthday = getBirthday(userId);
    if (!birthday) {
      sendToLINE(userId, 'こんにちは！生年月日を入力してください（例：2001-07-01）');
    }
    return ContentService.createTextOutput('OK');
  }

  // ② メッセージ受信
  if (event.type === 'message' && event.message.type === 'text') {
    const userText = event.message.text.trim();

    // 生年月日登録（初回のみ）
    if (/^\d{4}-\d{2}-\d{2}$/.test(userText)) {
      const already = getBirthday(userId);
      if (!already) {
        saveBirthday(userId, userText);
        sendToLINE(userId, '登録完了！次回から「占い結果」ボタンを押すだけで結果が見られます✨');
      }
      return ContentService.createTextOutput('OK');
    }

    // 占い結果
    if (userText === '占い結果') {
      const birthday = getBirthday(userId);
      if (!birthday) {
        sendToLINE(userId, 'まだ生年月日が登録されていません。入力してください（例：2001-07-01）');
        return ContentService.createTextOutput('OK');
      }

      // ⭐ A: ランキング
      const ranking = generateRanking();
      const A = calcA();

      const rankingText =
        `【今日のランキング】\n` +
        `干支順位: ${ranking.zodiacRank}\n` +
        `星座順位: ${ranking.constellationRank}\n` +
        `総合順位: ${ranking.overallRank} 位\n` +
        `運勢スコア(A): ${(A * 100).toFixed(1)}%`;

      sendToLINE(userId, rankingText);

      // ⭐ B: センサー平均値
      const avg = getSensorAverages();
      const sleepHours = getSleepHours() || 7;
      const region = "関東"; // 必要ならユーザー登録に変更可能
      const rainP = getRainProbability(region);

      // ⭐ C: ラッキーアイテム
      const luckyItem = getLuckyItem(avg.avgTmp, avg.avgHum, sleepHours, rainP);
      sendToLINE(userId, `【ラッキーアイテム】\n${luckyItem}`);

      // ⭐ D: アドバイス（Gemini）
      const advice = generateAdvice(avg.avgTmp, avg.avgHum, sleepHours, rainP);
      sendToLINE(userId, `【今日のアドバイス】\n${advice}`);

      return ContentService.createTextOutput('OK');
    }
  }

  return ContentService.createTextOutput('OK');
}

// 生年月日保存（初回のみ）
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

// LINE送信
function sendToLINE(userId, text) {
  const url = 'https://api.line.me/v2/bot/message/push';
  const payload = {
    to: userId,
    messages: [{ type: 'text', text: text }]
  };

  UrlFetchApp.fetch(url, {
    method: 'post',
    headers: { Authorization: 'Bearer ' + CHANNEL_ACCESS_TOKEN },
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  });
}
