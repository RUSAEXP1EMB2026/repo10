/**
 * 干支と星座の順位をランダムに決定し、最終順位を算出します。
 * 星座を重視する設計としています。
 */

/**
 * 1〜12 のランダムな順位を返す。
 * @return {number}
 */
function getZodiacRank() {
    return getRandomRank(12);
}

/**
 * 1〜12 のランダムな順位を返す。
 * @return {number}
 */
function getConstellationRank() {
    return getRandomRank(12);
}

/**
 * 干支と星座の順位から、1〜144 の最終順位を返す。
 * 星座を重視するため、星座順位ごとに 12 個ずつのグループに分ける。
 *
 * 例: 星座順位 1, 干支順位 1 なら 1 位、
 *     星座順位 1, 干支順位 12 なら 12 位、
 *     星座順位 2, 干支順位 1 なら 13 位、...
 *
 * @param {number} zodiacRank 干支順位 (1〜12)
 * @param {number} constellationRank 星座順位 (1〜12)
 * @return {number}
 */
function getOverallRank(zodiacRank, constellationRank) {
    var validZodiac = clampRank(zodiacRank, 12);
    var validConstellation = clampRank(constellationRank, 12);
    return (validConstellation - 1) * 12 + validZodiac;
}

/**
 * 干支・星座それぞれの順位と、最終順位をまとめたオブジェクトを返す。
 * @return {{zodiacRank:number, constellationRank:number, overallRank:number}}
 */
function generateRanking() {
    var zodiacRank = getZodiacRank();
    var constellationRank = getConstellationRank();
    return {
        zodiacRank: zodiacRank,
        constellationRank: constellationRank,
        overallRank: getOverallRank(zodiacRank, constellationRank)
    };
}

/**
 * 1〜max のランダムな整数を返す。
 * @param {number} max 最大値
 * @return {number}
 */
function getRandomRank(max) {
    return Math.floor(Math.random() * max) + 1;
}

/**
 * ランクを 1〜max の範囲に収める。
 * @param {number} rank 入力値
 * @param {number} max 最大値
 * @return {number}
 */
function clampRank(rank, max) {
    if (typeof rank !== 'number' || isNaN(rank)) {
        return 1;
    }
    rank = Math.floor(rank);
    if (rank < 1) {
        return 1;
    }
    if (rank > max) {
        return max;
    }
    return rank;
}

/**
 * generateRanking の結果をログに出力して返す。
 */
function logRankingResult() {
    var result = generateRanking();
    console.log('Ranking result:', result);
    return result;
}
