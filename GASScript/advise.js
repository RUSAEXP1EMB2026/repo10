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
    if (generatedText) {
        return normalizeAdviceToThreeSentences(
            generatedText,
            averageTemperature,
            averageHumidity,
            sleepHours,
            precipitationProbability
        );
    }

    return buildFallbackAdvice(
        averageTemperature,
        averageHumidity,
        sleepHours,
        precipitationProbability
    );
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
        '次の条件に基づいて、ユーザーに送る占いアドバイスを3つの短い文章で作成してください。',
        '気温・湿度・睡眠時間・降水確率の4つの要素の中から、特に影響が大きいものを3つ選んで、それぞれ1文で表してください。',
        '選ばれなかった要素は省いて構いません。',
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
    var apiKey = getGeminiApiKey();
    if (!apiKey) {
        Logger.log('GEMINI_API_KEY is not set.');
        return null;
    }

    var modelName = 'gemini-2.0-flash';
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
        if (responseCode !== 200) {
            Logger.log('Gemini API error: ' + response.getContentText());
            return null;
        }

        var data = JSON.parse(response.getContentText());
        if (
            data.candidates &&
            data.candidates[0] &&
            data.candidates[0].content &&
            data.candidates[0].content.parts
        ) {
            return data.candidates[0].content.parts
                .map(function (part) {
                    return part.text || '';
                })
                .join('');
        }
    } catch (error) {
        Logger.log('Gemini API request failed: ' + error);
    }

    return null;
}

/**
 * Gemini API キーをプロパティから取得する。
 * @return {string|null}
 */
function getGeminiApiKey() {
    return PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
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
