// doGet(e) ではなく doPost(e) を使う
function doPost(e){
  let sheet = SpreadsheetApp.getActive().getActiveSheet();
  sheet.appendRow([new Date(), e.postData.contents]); // e.postData.contents に LINE からの json 形式データがある
}