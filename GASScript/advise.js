/**
 * 平均気温・湿度・睡眠時間・降水確率に応じて、
 * Gemini API を使って占いアドバイスを生成するモジュールです。
 */

/**
 * メインの生成関数。
 * @param {number} averageTemperature 平均気温
 * @param {number} averageHumidity 平均湿度
 * @param {number} sleepHours 睡眠時間（時間）
 * @param {number} precipitationProbability 降水確率（%）
 * @return {string}
 */
function generateAdvice(averageTemperature, averageHumidity, sleepHours, precipitationProbability) {
    var prompt = buildAdvicePrompt(
        averageTemperature,
        averageHumidity,
        sleepHours,
        precipitationProbability
    );

    var generatedText = callGeminiAdvice(prompt);
    var aiSentence = null;
    if (generatedText) {
        aiSentence = normalizeAdviceToOneSentence(generatedText);
    }

    if (!aiSentence) {
        aiSentence = buildFallbackAISentence(
            averageTemperature,
            averageHumidity,
            sleepHours,
            precipitationProbability
        );
    }

    var ruleSentences = buildRuleBasedAdvice(
        averageTemperature,
        averageHumidity,
        sleepHours,
        precipitationProbability
    );

    return [aiSentence].concat(ruleSentences).join(' ');
}

/**
 * 既存モジュールからの値を受け取るための別名。
 * @param {number} averageTemperature 平均気温
 * @param {number} averageHumidity 平均湿度
 * @param {number} sleepHours 睡眠時間（時間）
 * @param {number} precipitationProbability 降水確率（%）
 * @return {string}
 */
function generateAdviceFromMetrics(averageTemperature, averageHumidity, sleepHours, precipitationProbability) {
    return generateAdvice(averageTemperature, averageHumidity, sleepHours, precipitationProbability);
}

/**
 * Gemini API に送るプロンプトを作成する。
 * @param {number} averageTemperature 平均気温
 * @param {number} averageHumidity 平均湿度
 * @param {number} sleepHours 睡眠時間（時間）
 * @param {number} precipitationProbability 降水確率（%）
 * @return {string}
 */
function buildAdvicePrompt(averageTemperature, averageHumidity, sleepHours, precipitationProbability) {
    return [
        'あなたは日本語の占い師です。',
        '次の条件に基づいて、ユーザーに送る短く総合的な占いアドバイスを1文で作成してください。',
        '文章はやさしく、ポジティブで、実生活に役立つ内容にしてください。',
        '平均気温: ' + averageTemperature + '℃',
        '平均湿度: ' + averageHumidity + '%',
        '睡眠時間: ' + sleepHours + '時間',
        '降水確率: ' + precipitationProbability + '%'
    ].join('\n');
}

/**
 * Gemini API を呼び出して文章を取得する。
 * @param {string} prompt プロンプト
 * @return {string|null}
 */
function callGeminiAdvice(prompt) {
    // キャッシュキーはプロンプトのハッシュ（短縮）を使う
    var cacheKey = 'gemini:' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, prompt)).slice(0, 22);
    var cache = CacheService.getScriptCache();
    var cached = cache.get(cacheKey);
    if (cached) {
        return cached;
    }

    var apiKey = getGeminiApiKey();
    if (!apiKey) {
        Logger.log('GEMINI_API_KEY is not set.');
        return null;
    }

    var modelName = 'gemini-2.0-flash-lite';
    var payload = {
        contents: [
            {
                parts: [
                    {
                        text: prompt
                    }
                ]
            }
        ],
        generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 120
        }
    };

    try {
        var response = UrlFetchApp.fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/' + modelName + ':generateContent?key=' + apiKey,
            {
                method: 'post',
                contentType: 'application/json',
                payload: JSON.stringify(payload),
                muteHttpExceptions: true
            }
        );

        var responseCode = response.getResponseCode();
        var content = response.getContentText();

        // レート制限などの判定: 429 やエラーメッセージが含まれる場合は null を返してフォールバック
        if (responseCode === 429) {
            Logger.log('Gemini rate limited (429).');
            return null;
        }

        if (responseCode !== 200) {
            Logger.log('Gemini API error (' + responseCode + '): ' + content);
            return null;
        }

        var data = JSON.parse(content);
        if (
            data.candidates &&
            data.candidates[0] &&
            data.candidates[0].content &&
            data.candidates[0].content.parts
        ) {
            var out = data.candidates[0].content.parts
                .map(function (part) {
                    return part.text || '';
                })
                .join('');

            // 成功したらキャッシュに保存（TTLは設定またはデフォルト300秒）
            var ttl = getGeminiCacheTTLSeconds();
            try {
                cache.put(cacheKey, out, ttl);
            } catch (e) {
                Logger.log('Cache put failed: ' + e);
            }

            return out;
        }
    } catch (error) {
        Logger.log('Gemini API request failed: ' + error);
    }

    return null;
}

/**
 * キャッシュの TTL を秒で返す。
 * スクリプトプロパティ `GEMINI_CACHE_TTL_SECONDS` が設定されていればそれを使う。
 */
function getGeminiCacheTTLSeconds() {
    var v = PropertiesService.getScriptProperties().getProperty('GEMINI_CACHE_TTL_SECONDS');
    var n = parseInt(v, 10);
    if (!isNaN(n) && n > 0) {
        return n;
    }
    return 300; // デフォルト 5 分
}

/**
 * Gemini API キーをプロパティから取得する。
 * @return {string|null}
 */
function getGeminiApiKey() {
    return PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
}

/**
 * 生成済みテキストから1文を抽出する。
 * @param {string} generatedText
 * @return {string|null}
 */
function normalizeAdviceToOneSentence(generatedText) {
    var text = generatedText.replace(/\s+/g, ' ').trim();
    if (!text) {
        return null;
    }

    var sentences = text
        .split(/[。！？]\s*/)
        .filter(function (sentence) {
            return sentence.trim().length > 0;
        });

    if (sentences.length > 0) {
        return sentences[0].trim() + '。';
    }

    return null;
}

/**
 * ルールベースで2文のアドバイスを返す。
 */
function buildRuleBasedAdvice(averageTemperature, averageHumidity, sleepHours, precipitationProbability) {
    var rules = [];

    if (averageTemperature < 18) {
        rules.push({ score: 100 - averageTemperature, text: '気温が低めなので、体を温かく保って無理をしないようにしましょう。' });
    } else if (averageTemperature > 30) {
        rules.push({ score: averageTemperature - 30, text: '気温が高くなるので、熱中症対策とこまめな水分補給を忘れずに。' });
    } else {
        rules.push({ score: 10, text: '気温は過ごしやすいので、落ち着いて行動すると良いでしょう。' });
    }

    if (averageHumidity > 70) {
        rules.push({ score: averageHumidity - 70, text: '湿度が高めなので、こまめな換気や水分補給で快適さを保ってください。' });
    } else if (averageHumidity < 40) {
        rules.push({ score: 40 - averageHumidity, text: '乾燥しやすいので、手洗いや保湿で体調管理を心がけてください。' });
    } else {
        rules.push({ score: 10, text: '湿度はほどよいので、普段どおりのリズムで過ごすと安心です。' });
    }

    if (sleepHours < 6) {
        rules.push({ score: 6 - sleepHours, text: '睡眠時間が短めなので、今日は早めに休んで体調を整えましょう。' });
    } else if (sleepHours >= 8) {
        rules.push({ score: sleepHours - 7, text: '睡眠時間は充分なので、余裕をもって落ち着いた時間を大切にしてください。' });
    } else {
        rules.push({ score: 5, text: '睡眠リズムは安定しているので、今日も丁寧に過ごすとよいでしょう。' });
    }

    if (precipitationProbability > 60) {
        rules.push({ score: precipitationProbability - 60 + 20, text: '雨の可能性が高いので、傘などの備えを忘れずに。' });
    } else if (precipitationProbability > 30) {
        rules.push({ score: precipitationProbability - 30 + 10, text: '雨の心配はあるので、午後の予定は柔軟に調整できると安心です。' });
    } else {
        rules.push({ score: 5, text: '雨の心配は少なめなので、屋外の予定も立てやすいでしょう。' });
    }

    rules.sort(function (a, b) {
        return b.score - a.score;
    });

    return [rules[0].text, rules[1].text];
}

/**
 * AI が使えない場合の1文アドバイスを生成する。
 */
function buildFallbackAISentence(averageTemperature, averageHumidity, sleepHours, precipitationProbability) {
    if (averageTemperature < 18) {
        return '今日は気温が低めなので、温かくしてゆっくり過ごすと安心です。';
    }
    if (averageTemperature > 30) {
        return '今日は暑さに気をつけて、水分補給をこまめにしてください。';
    }
    if (precipitationProbability > 60) {
        return '雨が強くなる可能性があるため、出かけるときは忘れずに傘を持ってください。';
    }
    return '今日は穏やかな一日になりそうなので、無理せず自分のペースで過ごすとよいでしょう。';
}

/**
 * API が使えない場合のローカルフォールバック文章を返す。
 * @param {number} averageTemperature 平均気温
 * @param {number} averageHumidity 平均湿度
 * @param {number} sleepHours 睡眠時間（時間）
 * @param {number} precipitationProbability 降水確率（%）
 * @return {string}
 */
function buildFallbackAdvice(averageTemperature, averageHumidity, sleepHours, precipitationProbability) {
    var adviceParts = [];

    if (averageTemperature < 18 || averageTemperature > 30) {
        adviceParts.push('気温が気になる日なので、体調を整えて無理のない予定にすると良いです。');
    }

    if (averageHumidity > 70 || averageHumidity < 40) {
        adviceParts.push('湿度の変化に注意して、こまめに水分補給や休息を取ると安心です。');
    }

    if (sleepHours < 6 || sleepHours >= 8) {
        adviceParts.push('睡眠時間のバランスが気になるので、早めに休息を取ると気分も安定します。');
    }

    if (precipitationProbability > 60) {
        adviceParts.push('雨の予報が高いので、傘やレインコートを準備しておくと安心です。');
    }

    if (adviceParts.length === 0) {
        return '今日は落ち着いて自分のペースで過ごすと、良い流れが生まれます。';
    }

    return normalizeAdviceToThreeSentences(adviceParts.join(' '), averageTemperature, averageHumidity, sleepHours, precipitationProbability);
}

/**
 * 文章を3文に整える。
 * @param {string} text 元の文章
 * @param {number} averageTemperature 平均気温
 * @param {number} averageHumidity 平均湿度
 * @param {number} sleepHours 睡眠時間（時間）
 * @param {number} precipitationProbability 降水確率（%）
 * @return {string}
 */
function normalizeAdviceToThreeSentences(text, averageTemperature, averageHumidity, sleepHours, precipitationProbability) {
    var parts = [];

    if (text) {
        parts = text.split(/(?<=[。！？])/).filter(function (sentence) {
            return sentence && sentence.trim();
        });
    }

    if (parts.length >= 3) {
        return parts.slice(0, 3).join(' ');
    }

    if (parts.length === 2) {
        parts.push(buildFallbackSentenceForMissingCategory(averageTemperature, averageHumidity, sleepHours, precipitationProbability, parts.length));
        return parts.join(' ');
    }

    if (parts.length === 1) {
        parts.push(buildFallbackSentenceForMissingCategory(averageTemperature, averageHumidity, sleepHours, precipitationProbability, 1));
        parts.push(buildFallbackSentenceForMissingCategory(averageTemperature, averageHumidity, sleepHours, precipitationProbability, 2));
        return parts.join(' ');
    }

    return buildFallbackAdvice(averageTemperature, averageHumidity, sleepHours, precipitationProbability);
}

/**
 * 不足しているカテゴリに対する補完文を返す。
 * @param {number} averageTemperature 平均気温
 * @param {number} averageHumidity 平均湿度
 * @param {number} sleepHours 睡眠時間（時間）
 * @param {number} precipitationProbability 降水確率（%）
 * @param {number} index 追加位置
 * @return {string}
 */
function buildFallbackSentenceForMissingCategory(averageTemperature, averageHumidity, sleepHours, precipitationProbability, index) {
    if (index === 0) {
        if (averageTemperature < 18 || averageTemperature > 30) {
            return '気温が気になる日なので、体調を整えて無理のない予定にすると良いです。';
        }
        return '今日は過ごしやすい気候なので、穏やかな気持ちで一日を進めると運気が開けます。';
    }

    if (index === 1) {
        if (averageHumidity > 70 || averageHumidity < 40) {
            return '湿度の変化に注意して、こまめに水分補給や休息を取ると安心です。';
        }
        return '湿度はほどよいので、無理をせずに自分のペースで過ごすと良いです。';
    }

    if (index === 2) {
        if (sleepHours < 6 || sleepHours >= 8) {
            return '睡眠時間のバランスが気になるので、早めに休息を取ると気分も安定します。';
        }
        return '睡眠時間はまあまあなので、今日はゆっくりとした時間を大切にすると良いです。';
    }

    if (precipitationProbability > 60) {
        return '雨の予報が高いので、傘やレインコートを準備しておくと安心です。';
    }

    return '今日は落ち着いて自分のペースで過ごすと、良い流れが生まれます。';
}

/**
 * 実行確認用のサンプル関数。
 */
function testAdvice() {
    var result = generateAdvice(24, 55, 7.5, 30);
    Logger.log(result);
    return result;
}

/**
 * センサ平均値と地域名から降水確率を取得してアドバイスを生成するラッパー。
 * @param {string} regionName 地域名（例: '関東'）。省略時は '関東' を使用。
 * @param {number=} sleepHours 睡眠時間（時間）。未指定時は 7 を使用。
 * @return {string}
 */
function generateAdviceFromSensors(regionName, sleepHours) {
    regionName = regionName || '関東';
    sleepHours = typeof sleepHours === 'number' ? sleepHours : 7;

    // getSensorAverages は average.js で定義されている想定
    var averages = getSensorAverages();
    var avgTmp = averages && typeof averages.avgTmp === 'number' ? averages.avgTmp : 24;
    var avgHum = averages && typeof averages.avgHum === 'number' ? averages.avgHum : 55;

    // getRainProbability は rainProbability.js で定義されている想定
    var precip = 0;
    try {
        precip = getRainProbability(regionName);
    } catch (e) {
        Logger.log('getRainProbability failed: ' + e);
        precip = 0;
    }


    return generateAdvice(avgTmp, avgHum, sleepHours, precip);
}
