// ★ LINEチャネルアクセストークン（長期）を入れる
const CHANNEL_ACCESS_TOKEN = 'dmJQn1Gx+tr/ybTl3Ixgwbg0gnyTZ4Djx7gyOnx+F4AZ4efiJEra9e+/Ycma1FVtVbjMQqTM8a40kjSAdSYrGhMiJXV+nAdf9SltYcxWzji01xC0Y/YVLLhi+xubAPOMWABETifoCphfiobQ/a6EBAdB04t89/1O/w1cDnyilFU=';

// ★ メイン：LINEからのPOSTを受け取る
function doPost(e) {
  const json = JSON.parse(e.postData.contents);
  const event = json.events[0];

  // メッセージイベントのみ処理
  if (event.type === 'message' && event.message.type === 'text') {
    const userId = event.source.userId;
    const userText = event.message.text;

    // ★ リッチメニューのボタンが送るテキストを判定
    if (userText === 'うい') {
      // 占い結果を導出する関数（あなたが作る）
      const resultText = getFortuneResult();

      // 結果が空ならメンテナンス中
      const messageText = resultText ? resultText : 'ただいまメンテナンス中';

      // LINEに返信
      sendToLINE(userId, messageText);
    }
  }

  return ContentService.createTextOutput('OK');
}

// ★ LINEにメッセージを送信する関数
function sendToLINE(userId, text) {
  const url = 'https://api.line.me/v2/bot/message/push';

  const payload = {
    to: userId,
    messages: [
      {
        type: 'text',
        text: text
      }
    ]
  };

  UrlFetchApp.fetch(url, {
    method: 'post',
    headers: {
      Authorization: 'Bearer ' + CHANNEL_ACCESS_TOKEN
    },
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  });
}

// ★ 占い結果を導出する関数（あなたが自由に作る）
function getFortuneResult() {
  // ここで結果を返す（例）
  // return "今日の運勢は大吉です！";

  return ""; // 空ならメンテナンス中になる
}
