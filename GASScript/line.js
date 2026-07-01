function doGet(e) {
  // 他の関数で占い結果テキストを導出
  const resultText = getFortuneResult(); // 別関数が返すテキスト

  // 結果が空・null・undefinedならメンテナンス中メッセージに置き換え
  const messageText = resultText ? resultText : "ただいまメンテナンス中";

  // LINE公式アカウントにメッセージとして投稿
  const token = "dmJQn1Gx+tr/ybTl3Ixgwbg0gnyTZ4Djx7gyOnx+F4AZ4efiJEra9e+/Ycma1FVtVbjMQqTM8a40kjSAdSYrGhMiJXV+nAdf9SltYcxWzji01xC0Y/YVLLhi+xubAPOMWABETifoCphfiobQ/a6EBAdB04t89/1O/w1cDnyilFU=";
  const url = "https://api.line.me/v2/bot/message/push";
  const payload = {
    to: "ユーザーID", // 固定送信ならここに設定
    messages: [{ type: "text", text: messageText }]
  };

  UrlFetchApp.fetch(url, {
    method: "post",
    headers: { Authorization: "Bearer " + token },
    contentType: "application/json",
    payload: JSON.stringify(payload)
  });

  return ContentService.createTextOutput("OK");
}
