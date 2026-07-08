const CHANNEL_ACCESS_TOKEN = 'sGrX18d8EAOVD/iyVQdvHScc2zUZD3/zbHU9T21N2F1hkZgGdsnEm2rVfYDUgwVvVbjMQqTM8a40kjSAdSYrGhMiJXV+nAdf9SltYcxWzjhKHiJXTk0kmb1EkHq71QIrJRSgnFQlf6T5/lXG+EIfGgdB04t89/1O/w1cDnyilFU=';
const SHEET_ID = '1LP6hXdUgDEO8EastWvRNnCsfBg0yapZvORRiTzrhHZs'; // 生年月日を保存するシート

// function doPost(e) {
//   const json = JSON.parse(e.postData.contents);
//   const event = json.events[0];
//   const userId = event.source.userId;

//   // ① 友だち追加イベント（follow）
//   if (event.type === 'follow') {
//     sendToLINE(userId, 'こんにちは！生年月日を入力してください（例：2001-07-01）');
//     return ContentService.createTextOutput('OK');
//   }

//   // ② メッセージイベント
//   if (event.type === 'message' && event.message.type === 'text') {
//     const userText = event.message.text.trim();

//     // 生年月日形式かどうか確認（YYYY-MM-DD）
//     if (/^\d{4}-\d{2}-\d{2}$/.test(userText)) {
//       saveBirthday(userId, userText);
//       sendToLINE(userId, '登録完了！次回から「占い」ボタンを押すだけで結果が見られます✨');
//       return ContentService.createTextOutput('OK');
//     }

//     // 「占い」ボタンが押された場合
//     if (userText === '占い結果') {
//       const birthday = getBirthday(userId);
//       if (!birthday) {
//         sendToLINE(userId, 'まだ生年月日が登録されていません。入力してください（例：2001-07-01）');
//         return ContentService.createTextOutput('OK');
//       }

//       const resultText = getFortuneResult(birthday);
//       const messageText = resultText ? resultText : 'ただいまメンテナンス中';
//       sendToLINE(userId, messageText);
//       return ContentService.createTextOutput('OK');
//     }
//   }

//   return ContentService.createTextOutput('OK');
// }

function doPost(e) {
  // LINEから送られてきたWebhookデータを解析
  const json = JSON.parse(e.postData.contents);
  const event = json.events[0];

  // メッセージイベントではない、またはテキストメッセージではない場合は終了
  if (event.type !== 'message' || event.message.type !== 'text') {
    return ContentService.createTextOutput(JSON.stringify({'content': 'post ok'}))
                         .setMimeType(ContentService.MimeType.JSON);
  }

  // ユーザーからのメッセージと返信用トークンを取得
  const userMessage = event.message.text;
  const replyToken = event.replyToken;

  // LINEの応答用API URL
  const url = 'https://api.line.me/v2/bot/message/reply';

  // 送信するデータ（受け取ったメッセージをそのままセット）
  const payload = {
    'replyToken': replyToken,
    'messages': [{
      'type': 'text',
      'text': userMessage // ここでオウム返しをしています
    }]
  };

  // 通信オプション
  const options = {
    'method': 'post',
    'headers': {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN
    },
    'payload': JSON.stringify(payload)
  };

  // LINEへデータを送信
  UrlFetchApp.fetch(url, options);

  // LINE側に成功を返す
  return ContentService.createTextOutput(JSON.stringify({'content': 'post ok'}))
                       .setMimeType(ContentService.MimeType.JSON);
}

// 🔹 生年月日をスプレッドシートに保存
function saveBirthday(userId, birthday) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('birthday');
  sheet.appendRow([userId, birthday]);
}

// 🔹 生年月日を取得
function getBirthday(userId) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('birthday');
  const data = sheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === userId) return data[i][1];
  }
  return null;
}

// 🔹 LINEにメッセージを送信
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

// 🔹 占い結果を導出する関数
function getFortuneResult(birthday) {
  const year = parseInt(birthday.split('-')[0]);
  const luck = year % 5;
  const fortunes = ['大吉', '中吉', '小吉', '吉', '凶'];
  return `あなたの今日の運勢は「${fortunes[luck]}」です！`;
}
