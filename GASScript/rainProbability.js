const REGION_COORDS = {
  "北海道": { lat: 43.06417, lon: 141.34694 },
  "東北":   { lat: 38.26889, lon: 140.87194 },
  "関東":   { lat: 35.68944, lon: 139.69167 },
  "中部":   { lat: 35.18028, lon: 136.90667 },
  "近畿":   { lat: 34.6863,  lon: 135.5200  },
  "中国":   { lat: 34.39627, lon: 132.45937 },
  "四国":   { lat: 34.06583, lon: 134.55944 },
  "九州":   { lat: 33.60639, lon: 130.41806 }
};

function getRainProbability(regionName) {
  const apiKey = "ea57b15932fbf000df5cc64a6aeec444";

  const region = REGION_COORDS[regionName];
  if (!region) {
    throw new Error("不正な地域名です: " + regionName);
  }

  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${region.lat}&lon=${region.lon}&appid=${apiKey}&units=metric`;

  const response = UrlFetchApp.fetch(url);
  const data = JSON.parse(response.getContentText());

  const pop = data.list[0].pop; // 0〜1
  return pop * 100;             // 0〜100 に変換
}