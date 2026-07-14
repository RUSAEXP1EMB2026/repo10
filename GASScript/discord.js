/**
 * Discord Webhook を使って占い結果を送信するモジュールです。
 *
 * 既存の LINE 送信処理とは独立しており、PropertiesService
 * から DISCORD_WEBHOOK_URL を取得します。
 */

/**
 * Discord Webhook URL をスクリプトプロパティから取得します。
 * @return {string|null}
 */
function getDiscordWebhookUrl() {
    return PropertiesService.getScriptProperties().getProperty('DISCORD_WEBHOOK_URL');
}

/**
 * Discord にメッセージを送信します。
 * @param {string} message
 * @return {{success:boolean, statusCode:number|null, errorText:string|null}}
 */
function sendDiscordMessage(message) {
    if (!message || typeof message !== 'string') {
        return { success: false, statusCode: null, errorText: 'message is required' };
    }

    var webhookUrl = getDiscordWebhookUrl();
    if (!webhookUrl) {
        Logger.log('DISCORD_WEBHOOK_URL is not set.');
        return { success: false, statusCode: null, errorText: 'DISCORD_WEBHOOK_URL is not set' };
    }

    var chunks = splitDiscordMessage(message, 2000);
    var lastResult = { success: false, statusCode: null, errorText: 'No chunks sent' };

    for (var i = 0; i < chunks.length; i++) {
        var chunkResult = sendDiscordWebhookChunk(webhookUrl, chunks[i]);
        if (!chunkResult.success) {
            return chunkResult;
        }
        lastResult = chunkResult;
    }

    return lastResult;
}

/**
 * 占い結果データを整形し、Discord へ送信します。
 * @param {{happiness?:string|number, zodiac?:string, eto?:string, avgTemp?:number, avgHum?:number, sleepHours?:number, precipitationProbability?:number, advice?:string, zodiacRank?:number, constellationRank?:number, overallRank?:number, fortuneScore?:string|number}} fortuneResult
 * @return {{success:boolean, statusCode:number|null, errorText:string|null}}
 */
function sendDiscordFortune(fortuneResult) {
    if (!fortuneResult || typeof fortuneResult !== 'object') {
        return { success: false, statusCode: null, errorText: 'fortuneResult is required' };
    }

    var lines = [];
    if (fortuneResult.zodiacRank != null || fortuneResult.constellationRank != null || fortuneResult.overallRank != null) {
        lines.push('【今日のランキング】');
        if (fortuneResult.zodiacRank != null) {
            lines.push('干支順位: ' + fortuneResult.zodiacRank);
        }
        if (fortuneResult.constellationRank != null) {
            lines.push('星座順位: ' + fortuneResult.constellationRank);
        }
        if (fortuneResult.overallRank != null) {
            lines.push('総合順位: ' + fortuneResult.overallRank + ' 位');
        }
        if (fortuneResult.fortuneScore != null) {
            lines.push('運勢スコア: ' + fortuneResult.fortuneScore);
        }
        lines.push('');
    }

    if (fortuneResult.happiness != null) {
        lines.push('幸福度: ' + fortuneResult.happiness);
    }
    if (fortuneResult.eto != null) {
        lines.push('干支: ' + fortuneResult.eto);
    }
    if (fortuneResult.zodiac != null) {
        lines.push('星座: ' + fortuneResult.zodiac);
    }
    if (fortuneResult.avgTemp != null) {
        lines.push('平均気温: ' + fortuneResult.avgTemp + '℃');
    }
    if (fortuneResult.avgHum != null) {
        lines.push('平均湿度: ' + fortuneResult.avgHum + '%');
    }
    if (fortuneResult.sleepHours != null) {
        lines.push('睡眠時間: ' + fortuneResult.sleepHours + '時間');
    }
    if (fortuneResult.precipitationProbability != null) {
        lines.push('降水確率: ' + fortuneResult.precipitationProbability + '%');
    }
    if (fortuneResult.advice != null) {
        lines.push('');
        lines.push('【今日のアドバイス】');
        lines.push(fortuneResult.advice);
    }

    var message = lines.join('\n');
    if (!message || message.trim().length === 0) {
        Logger.log('sendDiscordFortune: generated message is empty');
        return { success: false, statusCode: null, errorText: 'Generated message is empty - check fortuneResult fields' };
    }
    return sendDiscordMessage(message);
}

/**
 * Discord の Webhook に1チャンクを送信する。
 * @param {string} webhookUrl
 * @param {string} content
 * @return {{success:boolean, statusCode:number|null, errorText:string|null}}
 */
function sendDiscordWebhookChunk(webhookUrl, content) {
    var maxRetries = 3;
    var retryDelayMs = 1000;

    for (var attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            var response = UrlFetchApp.fetch(webhookUrl, {
                method: 'post',
                contentType: 'application/json',
                payload: JSON.stringify({ content: content }),
                muteHttpExceptions: true
            });

            var statusCode = response.getResponseCode();
            var responseText = response.getContentText();
            if (statusCode >= 200 && statusCode < 300) {
                return { success: true, statusCode: statusCode, errorText: null };
            }

            var message = 'Discord webhook request failed: HTTP ' + statusCode;
            Logger.log(message);
            Logger.log(responseText);

            if (statusCode === 429 || statusCode >= 500) {
                if (attempt < maxRetries) {
                    Utilities.sleep(retryDelayMs);
                    retryDelayMs *= 2;
                    continue;
                }
            }
            return { success: false, statusCode: statusCode, errorText: responseText || message };
        } catch (e) {
            Logger.log('Discord webhook request exception: ' + e);
            if (attempt < maxRetries) {
                Utilities.sleep(retryDelayMs);
                retryDelayMs *= 2;
                continue;
            }
            return { success: false, statusCode: null, errorText: String(e) };
        }
    }

    return { success: false, statusCode: null, errorText: 'Retry attempts exhausted' };
}

/**
 * メッセージが長すぎる場合に 2000 文字以下に分割します。
 * @param {string} message
 * @param {number} maxLength
 * @return {string[]}
 */
function splitDiscordMessage(message, maxLength) {
    if (message.length <= maxLength) {
        return [message];
    }

    var lines = message.split('\n');
    var chunks = [];
    var current = '';

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (current.length + line.length + 1 <= maxLength) {
            current += (current ? '\n' : '') + line;
            continue;
        }

        if (current) {
            chunks.push(current);
            current = '';
        }

        if (line.length > maxLength) {
            var start = 0;
            while (start < line.length) {
                chunks.push(line.slice(start, start + maxLength));
                start += maxLength;
            }
            continue;
        }

        current = line;
    }

    if (current) {
        chunks.push(current);
    }

    return chunks;
}

/**
 * テスト送信用関数。
 * @return {{success:boolean, statusCode:number|null, errorText:string|null}}
 */
function testDiscordMessage() {
    var testMessage = 'Discord webhook test message from Apps Script.';
    return sendDiscordMessage(testMessage);
}
