function getSensorAverages() {
  const sheet = getSheet('sensor');
  const data = sheet.getDataRange().getValues();

  const rows = data.slice(1); // 1行目はヘッダー

  if (rows.length === 0) {
    return { avgTmp: null, avgHum: null, avgBri: null };
  }

  let sumTmp = 0;
  let sumHum = 0;
  let sumBri = 0;

  rows.forEach(row => {
    sumTmp += row[1]; // tmp
    sumHum += row[2]; // hum
    sumBri += row[3]; // bri
  });

  return {
    avgTmp: sumTmp / rows.length,
    avgHum: sumHum / rows.length,
    avgBri: sumBri / rows.length
  };
}
function testAverage() {
  const avg = getSensorAverages();
  console.log("平均気温(tmp): " + avg.avgTmp);
  console.log("平均湿度(hum): " + avg.avgHum);
  console.log("平均明るさ(bri): " + avg.avgBri);
}