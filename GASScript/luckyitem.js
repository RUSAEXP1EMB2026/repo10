/**
 * 平均気温・湿度・睡眠時間・降水確率をもとに
 * ラッキーアイテムの提示確率を調整するモジュールです。
 */

/**
 * 指定された指標に応じてラッキーアイテムを1つ選択します。
 * 特定の条件で確率が上がるものの、必ず選ばれるわけではありません。
 * @param {number} averageTemperature 平均気温
 * @param {number} averageHumidity 平均湿度
 * @param {number} sleepHours 睡眠時間（時間）
 * @param {number} precipitationProbability 降水確率（%）
 * @return {string}
 */
function getLuckyItem(averageTemperature, averageHumidity, sleepHours, precipitationProbability) {
    var baseItems = getBaseItems();
    var weightedItems = buildWeightedItemPatterns(baseItems);
    var weights = buildLuckyItemWeights(averageTemperature, averageHumidity, sleepHours, precipitationProbability, weightedItems);
    return chooseWeightedItem(weightedItems, weights);
}

function buildWeightedItemPatterns(items) {
    var colorPatterns = ['赤', '青', '緑', '黄', '白', '黒', 'ピンク', 'オレンジ'];
    var expandedItems = [];

    items.forEach(function (item) {
        expandedItems.push(item);
        if (shouldApplyColorPattern(item)) {
            var color = colorPatterns[Math.floor(Math.random() * colorPatterns.length)];
            expandedItems.push(color + '色の' + item);
        }
    });

    return expandedItems;
}

function shouldApplyColorPattern(item) {
    var colorTargets = ['傘', 'サングラス', 'ブランケット', '水筒', 'ネックウォーマー', 'スカーフ', 'スリッパ'];
    return colorTargets.indexOf(item) !== -1;
}

/**
 * 基本となるラッキーアイテムのリスト。
 * @return {string[]}
 */
function getBaseItems() {
    return [
        '傘',
        '温かい飲み物',
        '加湿器',
        'サングラス',
        'リラックスミュージック',
        'マスク',
        'ブランケット',
        '水筒',
        'ストレッチバンド',
        '香りのあるハンドクリーム',
        'ノート',
        'ヘッドフォン',
        'ミニ扇風機',
        '保湿クリーム',
        'ネックウォーマー',
        'スリッパ',
        'ペン',
        'スカーフ'
    ];
}

/**
 * 4つの指標に応じて、アイテムごとの重みを調整します。
 * @param {number} averageTemperature 平均気温
 * @param {number} averageHumidity 平均湿度
 * @param {number} sleepHours 睡眠時間（時間）
 * @param {number} precipitationProbability 降水確率（%）
 * @param {string[]} items アイテムリスト
 * @return {number[]}
 */
function buildLuckyItemWeights(averageTemperature, averageHumidity, sleepHours, precipitationProbability, items) {
    var weights = items.map(function () {
        return 1;
    });

    // 気温調整
    if (averageTemperature < 15) {
        adjustWeight(items, weights, '温かい飲み物', 3);
        adjustWeight(items, weights, 'ブランケット', 2);
    } else if (averageTemperature > 28) {
        adjustWeight(items, weights, 'サングラス', 2);
        adjustWeight(items, weights, '水筒', 3);
    }

    // 湿度調整
    if (averageHumidity > 70) {
        adjustWeight(items, weights, '加湿器', 2);
        adjustWeight(items, weights, '水筒', 2);
    } else if (averageHumidity < 40) {
        adjustWeight(items, weights, 'マスク', 2);
        adjustWeight(items, weights, '香りのあるハンドクリーム', 2);
    }

    // 睡眠時間調整
    if (sleepHours < 6) {
        adjustWeight(items, weights, 'リラックスミュージック', 3);
        adjustWeight(items, weights, 'ストレッチバンド', 2);
    } else if (sleepHours >= 8) {
        adjustWeight(items, weights, 'ノート', 2);
        adjustWeight(items, weights, 'ヘッドフォン', 2);
    }

    // 降水確率調整
    if (precipitationProbability > 60) {
        adjustWeight(items, weights, '傘', 4);
        adjustWeight(items, weights, 'マスク', 1.5);
    } else if (precipitationProbability > 30) {
        adjustWeight(items, weights, '傘', 2);
        adjustWeight(items, weights, '水筒', 1.2);
    }

    // 最低重みを設定
    return weights.map(function (weight) {
        return Math.max(weight, 0.1);
    });
}

/**
 * 指定したアイテムの重みを加算します。
 * @param {string[]} items
 * @param {number[]} weights
 * @param {string} targetItem
 * @param {number} amount
 */
function adjustWeight(items, weights, targetItem, amount) {
    for (var i = 0; i < items.length; i++) {
        if (items[i] === targetItem || items[i].endsWith('色の' + targetItem)) {
            weights[i] += amount;
        }
    }
}

/**
 * 重み付きランダムでアイテムを選択します。
 * @param {string[]} items
 * @param {number[]} weights
 * @return {string}
 */
function chooseWeightedItem(items, weights) {
    var totalWeight = weights.reduce(function (sum, value) {
        return sum + value;
    }, 0);

    var rand = Math.random() * totalWeight;
    var cumulative = 0;

    for (var i = 0; i < items.length; i++) {
        cumulative += weights[i];
        if (rand <= cumulative) {
            return items[i];
        }
    }

    return items[items.length - 1];
}

/**
 * 実行確認用のサンプル関数。
 */
function testLuckyItem() {
    var item = getLuckyItem(22, 55, 7, 40);
    Logger.log('Lucky item: ' + item);
    return item;
}
