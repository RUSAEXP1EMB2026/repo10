// 干支を取得
function getZodiacAnimal(year) {
  const animals = [
    "子", "丑", "寅", "卯", "辰", "巳",
    "午", "未", "申", "酉", "戌", "亥"
  ];
  const index = (year - 2020) % 12;
  return animals[(index + 12) % 12];
}

// 星座を取得
function getHoroscope(month, day) {
  const ranges = [
    ["やぎ座", 1, 19],
    ["みずがめ座", 1, 20],
    ["うお座", 2, 19],
    ["おひつじ座", 3, 21],
    ["おうし座", 4, 20],
    ["ふたご座", 5, 21],
    ["かに座", 6, 22],
    ["しし座", 7, 23],
    ["おとめ座", 8, 23],
    ["てんびん座", 9, 23],
    ["さそり座", 10, 23],
    ["いて座", 11, 22],
    ["やぎ座", 12, 22]
  ];

  for (let i = 0; i < ranges.length; i++) {
    const [name, m, d] = ranges[i];
    if (month === m && day <= d) return name;
    if (month === m + 1 && day < ranges[i + 1]?.[2]) return name;
  }
  return "不明";
}

// 生年月日から干支と星座を返す
function getEtoseiza(birthday) {
  const [year, month, day] = birthday.split("-").map(Number);
  const zodiac = getZodiacAnimal(year);
  const horoscope = getHoroscope(month, day);
  return `干支：${zodiac}\n星座：${horoscope}`;
}
function testEto() {
  const birthday = "2001-07-01";  // ←好きな生年月日に変更OK
  const result = getEtoseiza(birthday);
  Logger.log(result);
}
