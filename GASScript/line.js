function doGet(e) {
  const result = getFortuneResult("fortune_today");
  return ContentService.createTextOutput(result);
}


function doPost(e) {
  const json = JSON.parse(e.postData.contents);
  const event = json.events[0];
  const token = event.replyToken;

  // postbackイベントを検知
  if (event.type === "postback") {
    const data = event.postback.data;

    // 占い結果を算出する関数を呼び出す
    const result = getFortuneResult(data);

    // LINEに返信
    replyMessage(token, result);
  }
}

// 占い結果を算出する関数（例）
function getFortuneResult(data) {
  if (data === "fortune_today") {
    const fortunes = ["大吉", "中吉", "小吉", "凶"];
    const advice = ["今日は積極的に行動を！", "焦らず落ち着いて。", "人との会話を大切に。", "休息を取る日。"];
    const index = Math.floor(Math.random() * fortunes.length);
    return `今日の運勢：${fortunes[index]}\nアドバイス：${advice[index]}`;
  }
  return "占いデータが見つかりません。";
}

// LINE返信関数
function replyMessage(token, text) {
  const url = "https://api.line.me/v2/bot/message/reply";
  const headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer dmJQn1Gx+tr/ybTl3Ixgwbg0gnyTZ4Djx7gyOnx+F4AZ4efiJEra9e+/Ycma1FVtVbjMQqTM8a40kjSAdSYrGhMiJXV+nAdf9SltYcxWzji01xC0Y/YVLLhi+xubAPOMWABETifoCphfiobQ/a6EBAdB04t89/1O/w1cDnyilFU=" // チャネルアクセストークン
  };
  const body = JSON.stringify({
    replyToken: token,
    messages: [{ type: "text", text: text }]
  });
  UrlFetchApp.fetch(url, { method: "post", headers: headers, payload: body });
}
