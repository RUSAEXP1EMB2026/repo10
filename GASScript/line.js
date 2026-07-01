//line用 

function doPost(e){
  let data = JSON.parse(e.postData.contents); // LINE から来た json データを JavaScript のオブジェクトに変換する
  let events = data.events;
  for(let i = 0; i < events.length; i++){
    let event = events[i];
    if(event.type == 'message'){
      if(event.message.type == 'text'){ // 受信したのが普通のテキストメッセージだったとき
        let translatedText = "こんにちは";
        // 送信するデータをオブジェクトとして作成する
        let contents = {
          replyToken: event.replyToken, // event.replyToken は受信したメッセージに含まれる応答トークン
          messages: [{ type: 'text', text:  translatedText }],
        };
        reply(contents); // 下で説明
      }
    }
  }
}

function reply(contents){
  let channelAccessToken = "dmJQn1Gx+tr/ybTl3Ixgwbg0gnyTZ4Djx7gyOnx+F4AZ4efiJEra9e+/Ycma1FVtVbjMQqTM8a40kjSAdSYrGhMiJXV+nAdf9SltYcxWzji01xC0Y/YVLLhi+xubAPOMWABETifoCphfiobQ/a6EBAdB04t89/1O/w1cDnyilFU=";
  let replyUrl = "https://api.line.me/v2/bot/message/reply"; // LINE にデータを送り返すときに使う URL
  let options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + channelAccessToken
    },
    payload: JSON.stringify(contents) // リクエストボディは payload に入れる
  };
  UrlFetchApp.fetch(replyUrl, options);
}
