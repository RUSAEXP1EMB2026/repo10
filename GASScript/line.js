function doPost(e) {
  const json = JSON.parse(e.postData.contents);
  const event = json.events[0];

  // メッセージイベントを受け取る
  if (event.type === 'message' && event.message.type === 'text') {
    const userId = event.source.userId;
    const userText = event.message.text;

    // 「占い開始」など決められたメッセージが来たら結果を返す
    if (userText === '占い開始') {
      const resultText = getFortuneResult(); // 別関数で結果を導出
      const messageText = resultText ? resultText : 'ただいまメンテナンス中';
      sendToLINE(userId, messageText);
    }
  }

  return ContentService.createTextOutput('OK');
}

// LINEにメッセージを送信
function sendToLINE(userId, text) {
  const token = 'dmJQn1Gx+tr/ybTl3Ixgwbg0gnyTZ4Djx7gyOnx+F4AZ4efiJEra9e+/Ycma1FVtVbjMQqTM8a40kjSAdSYrGhMiJXV+nAdf9SltYcxWzji01xC0Y/YVLLhi+xubAPOMWABETifoCphfiobQ/a6EBAdB04t89/1O/w1cDnyilFU=';
  const url = 'https://api.line.me/v2/bot/message/push';
  const payload = {
    to: userId,
    messages: [{ type: 'text', text: text }]
  };

  UrlFetchApp.fetch(url, {
    method: 'post',
    headers: { Authorization: 'Bearer ' + token },
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  });
}

// 占い結果を導出する関数（別途定義）
function getFortuneResult() {
  // ここで占い結果を生成して返す
  return '今日の運勢は…大吉！';
}
