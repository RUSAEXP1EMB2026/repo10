# Fortune Teller (占い＆スマートホームセンサー連携システム)

![Fortune Teller](https://i.imgur.com/XpoLAuL.jpeg)

このプロジェクトは、Nature Remo 3 の室内環境センサーデータ、天気予報 API（OpenWeatherMap）、およびユーザーの生年月日（星座・干支）を連携させ、独自の「幸福度」と「占い結果」を算出して **Discord** でユーザーに提供するスマートライフ占いシステムです。

---

## 概要

- **生年月日からの運勢判定**: 登録された生年月日から星座と干支を自動判定し、当日のランキング（1〜144位）を算出。
- **室内環境の評価**: Nature Remo 3 から取得した室内の温度・湿度データを基に快適さを評価。
- **睡眠状態の解析**: 照度センサーの急激な変化（drop/rise）から「就寝時刻」「起床時刻」を検知し、睡眠時間を自動算出。
- **天候（降水確率）の評価**: OpenWeatherMap API から当日の降水確率を取得。
- **Gemini AI によるアドバイス**: 取得した環境・睡眠メトリクスに基づいて、ルールベースの文章2文とGemini API（gemini-3.1-flash-lite）がやさしく実生活に役立つアドバイスを1文で自動生成。

---

## 主要機能

### Discord 連携機能 (`discord-bot/index.js`)

- **`/register` (スラッシュコマンド)**:
  - インタラクティブなモーダルを表示し、生年月日 (`YYYY-MM-DD`) と地域（例: `関東`）を入力・登録。
  - 重複登録防止機能を備え、再登録時は既存ユーザーのデータを自動で上書き更新。
  - 登録データは Google スプレッドシートの **A/B/C 列** に保存。
- **`/fortune` (スラッシュコマンド)**:
  - 登録情報と Nature Remo センサー値、天気予報を基にしたリッチな **Embed (埋め込み) メッセージ** で当日の占い結果を表示。
  - 総合順位や幸福度、ラッキーアイテム、今日の一言アドバイスが目立つようなメリハリのあるデザインレイアウト。
  - 天気 API の呼び出しを 1 回に集約する最適化や、データ欠損時の中央値フォールバック処理を完備し、エラー耐性を高めています。

---

## リポジトリ構成

```text
├── docs/             # 要求仕様書、設計書、スライド等
├── GASScript/        # Google Apps Script (GAS) 関連ファイル
│   ├── line.js             # WebAppのエントリーポイント (doPost)、LINE/Discord連携用API
│   ├── calculateHappy.js   # 幸福度・睡眠時間等の各種スコアリング演算ロジック
│   ├── average.js          # Nature Remoセンサーデータの平均値計算
│   ├── advise.js           # Gemini API を用いたアドバイス生成
│   └── ...
└── discord-bot/      # Discord.js (v14) による Discord ボットプロジェクト
    ├── index.js            # ボットのメイン処理（コマンド登録、モーダル、WebApp連携）
    └── .env.example        # 環境変数のサンプル
```

## セットアップ手順

### GAS 側の設定

1. [GASScript/.clasp.json](file:///c:/Users/Samba/Desktop/ruemb/repo10/GASScript/.clasp.json) に自身のスクリプトIDを設定します。
2. スクリプトをプッシュしてデプロイします：
   ```bash
   clasp push
   clasp deploy
   ```
3. GAS の「プロジェクトの設定（歯車アイコン）」を開き、以下の **スクリプトプロパティ** を追加します：
   - `GEMINI_API_KEY`: Gemini API のアクセスキー

### Discord Bot 側の設定

1. `discord-bot/` ディレクトリに移動し、依存関係をインストールします：
   ```bash
   npm install
   ```
2. `.env.example` をコピーして `.env` ファイルを作成し、各種トークンを記述します：
   - `DISCORD_TOKEN`: Discord Developer Portal で取得したボットのトークン
   - `DISCORD_CLIENT_ID`: ボットのクライアントID
   - `DISCORD_GUILD_ID`: ボットを導入する Discord サーバーのID
   - `APPS_SCRIPT_WEBAPP_URL`: デプロイした GAS WebApp の URL
3. ボットを起動します：
   ```bash
   npm start
   ```
