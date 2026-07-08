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
  const token = 'sGrX18d8EAOVD/iyVQdvHScc2zUZD3/zbHU9T21N2F1hkZgGdsnEm2rVfYDUgwVvVbjMQqTM8a40kjSAdSYrGhMiJXV+nAdf9SltYcxWzjhKHiJXTk0kmb1EkHq71QIrJRSgnFQlf6T5/lXG+EIfGgdB04t89/1O/w1cDnyilFU=';
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
