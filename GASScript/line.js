/**
 * リッチメニューのポストバックを受けて占い結果を返信する一連の処理
 * - リッチメニュー作成（API経由）
 * - ポストバック受信
 * - 結果導出関数呼び出し
 * - メッセージ返信
 */

const CHANNEL_ACCESS_TOKEN = 'あなたのチャネルアクセストークン';

// 🔹 リッチメニュー作成（初回のみ実行）
function createRichMenu() {
  const url = 'https://api.line.me/v2/bot/richmenu';
  const payload = {
    size: { width: 2500, height: 843 },
    selected: true,
    name: '占いメニュー',
    chatBarText: '占う',
    areas: [
      {
        bounds: { x: 0, y: 0, width: 2500, height: 843 },
        action: { type: 'postback', data: 'fortune_today' }
      }
    ]
  };

  const options = {
    method: 'post',
    headers: { Authorization: 'Bearer ' + CHANNEL_ACCESS_TOKEN },
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(url, options);
  Logger.log(response.getContentText());
}

// 🔹 ポストバック受信（占いボタンが押されたとき）
function doPost(e) {
  const json = JSON.parse(e.postData.contents);
  const event = json.events[0];

  // ポストバックデータを確認
  if (event.type === 'postback' && event.postback.data === 'fortune_today') {
    const userId = event.source.userId;

    // 占い結果を導出する関数を呼び出し
    const resultText = getFortuneResult();

    // 結果が空ならメンテナンス中メッセージ
    const messageText = resultText ? resultText : 'ただいまメンテナンス中';

    // LINEに返信
    sendToLINE(userId, messageText);
  }

  return ContentService.createTextOutput('OK');
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

// 🔹 占い結果を導出する関数（別途定義）
function getFortuneResult() {
  // ここで占い結果を生成して返す
  // 例: return "今日の運勢は…大吉！";
  return '';
}
