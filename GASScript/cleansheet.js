function clearSensorSheet() {
  const sheet = getSheet('sensor');
  const lastRow = sheet.getLastRow();

  // 1行目だけ残して、2行目以降を削除
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
}