function calcA() {
  const ranking = generateRanking();   // 干支・星座・最終順位を取得
  const rank = ranking.overallRank;    // 1〜144 の値

  const A = (145 - rank) / 144;

  // A を 0〜1 に収める（安全のため）
  return Math.max(0, Math.min(1, A));
}
function calcB() {
  const avg = getSensorAverages();

  const T = avg.avgTmp; // 気温
  const U = avg.avgHum; // 湿度

  const T0 = 25;
  const U0 = 50;

  if (T === null || U === null) {
    return null; // データがない場合
  }

  const termT = Math.abs(T - T0) / 15;
  const termU = Math.abs(U - U0) / 50;

  let B = 1 - (termT + termU) / 2;

  //  ここで 0〜1 に収める（クリップ処理）
  if (B < 0) B = 0;
  if (B > 1) B = 1;

  return B;
}
function testB() {
  const avg = getSensorAverages();  // 気温・湿度の平均値を取得

  Logger.log("平均気温 T = " + avg.avgTmp);
  Logger.log("平均湿度 U = " + avg.avgHum);

  const B = calcB();  // B を計算
  Logger.log("B = " + B);
}

function calcD(regionName) {
  const P = getRainProbability(regionName); // 地方名を渡す
  return (100 - P) / 100;
}


function testD() {
  const region = "東北"; // ← 好きな地方に変更
  const P = getRainProbability(region);
  const D = (100 - P) / 100;

  Logger.log("地域: " + region);
  Logger.log("降水確率 P = " + P + "%");
  Logger.log("D = " + D);
}