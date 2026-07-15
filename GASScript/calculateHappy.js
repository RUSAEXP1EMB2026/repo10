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
function getSleepHours() {
  const sheet = getSheet('sensor');
  const data = sheet.getDataRange().getValues().slice(1); // ヘッダー除外

  // 最後の dropFlag=1（就寝）
  const sleepRows = data.filter(row => row[4] === 1);
  if (sleepRows.length === 0) {
    Logger.log("就寝フラグ(dropFlag)がありません");
    return null;
  }
  const sleepTime = new Date(sleepRows[sleepRows.length - 1][0]);

  // 最後の wakeFlag=1（起床）
  const wakeRows = data.filter(row => row[5] === 1);
  if (wakeRows.length === 0) {
    Logger.log("起床フラグ(wakeFlag)がありません");
    return null;
  }
  const wakeTime = new Date(wakeRows[wakeRows.length - 1][0]);

  // 起床が就寝より前なら誤検知 → 無効
  if (wakeTime < sleepTime) {
    Logger.log("起床時刻が就寝時刻より前です（誤検知）");
    return null;
  }

  // 睡眠時間（時間）
  const diffHours = (wakeTime - sleepTime) / (1000 * 60 * 60);
  return diffHours;
}

function testC() {
  // 睡眠時間を取得
  const S = getSleepHours();

  if (S === null) {
    Logger.log("睡眠時間が取得できません（dropFlag または wakeFlag が不足）");
    return;
  }

  // 睡眠スコアを計算
  const C = calcC(S);

  Logger.log("睡眠時間 S = " + S.toFixed(2) + " 時間");
  Logger.log("睡眠スコア C = " + C.toFixed(2));
}



function calcC(S) {
  if (S === null) return null;  
  const ideal = 8;
  const score = 1 - Math.abs(S - ideal) / ideal;
  return Math.max(0, Math.min(1, score)); // 0〜1に収める
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

function calcH(A, B, C, D) {
  const safeA = (A != null && !isNaN(A)) ? A : 0.5;
  const safeB = (B != null && !isNaN(B)) ? B : 0.5;
  const safeC = (C != null && !isNaN(C)) ? C : 0.5;
  const safeD = (D != null && !isNaN(D)) ? D : 0.5;
  return 0.55 * safeA + 0.2 * safeB + 0.15 * safeC + 0.1 * safeD;
}

function testH() {
  // A（運動）
  const A = calcA();
  if (A === null) {
    Logger.log("A が取得できません");
    return;
  }

  // B（気温・湿度）
  const B = calcB();
  if (B === null) {
    Logger.log("B が取得できません");
    return;
  }

  // C（睡眠）
  const S = getSleepHours();
  if (S === null) {
    Logger.log("睡眠時間 S が取得できません（dropFlag または wakeFlag が不足）");
    return;
  }
  const C = calcC(S);

  // D（降水確率）
  const region = "東北";  // ← 好きな地域に変更可能
  const D = calcD(region);
  if (D === null) {
    Logger.log("D が取得できません（降水確率）");
    return;
  }

  // H（幸福度）
  const H = calcH(A, B, C, D);

  // ログ出力
  Logger.log("A = " + A.toFixed(2));
  Logger.log("B = " + B.toFixed(2));
  Logger.log("C = " + C.toFixed(2));
  Logger.log("D = " + D.toFixed(2));
  Logger.log("幸福度 H = " + H.toFixed(2));
}
