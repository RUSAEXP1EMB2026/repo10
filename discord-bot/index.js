import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } from 'discord.js';

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const APPS_SCRIPT_WEBAPP_URL = process.env.APPS_SCRIPT_WEBAPP_URL;
const APPS_SCRIPT_SECRET = process.env.APPS_SCRIPT_SECRET || '';

if (!TOKEN || !CLIENT_ID || !GUILD_ID || !APPS_SCRIPT_WEBAPP_URL) {
    console.error('Missing required env vars. See .env.example');
    process.exit(1);
}

if (typeof fetch === 'undefined') {
    console.error('Global fetch is not available. Use Node 18+ or install a fetch polyfill (e.g. undici) and restart.');
    process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    {
        name: 'register',
        description: '登録モーダルを表示して生年月日と地域を入力します'
    },
    {
        name: 'fortune',
        description: '今日の占い結果と室内環境データを表示します'
    }
];

async function registerCommands() {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        console.log('Registering slash commands...');
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        console.log('Commands registered.');
    } catch (err) {
        console.error('Failed to register commands', err);
    }
}

function isValidDateString(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(dateString);
    return (
        date.getFullYear() === year &&
        date.getMonth() + 1 === month &&
        date.getDate() === day
    );
}

async function sendRegistrationToWebApp(userId, birthdate, region) {
    const resp = await fetch(APPS_SCRIPT_WEBAPP_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-webapp-secret': APPS_SCRIPT_SECRET
        },
        body: JSON.stringify({ userId, birthdate, region, secret: APPS_SCRIPT_SECRET })
    });

    const text = await resp.text();
    if (!resp.ok) {
        throw new Error(`WebApp error ${resp.status}: ${text}`);
    }
    if (text.trim() !== 'OK') {
        throw new Error(`WebApp returned unexpected response: ${text}`);
    }
    return text;
}

async function getFortuneFromWebApp(userId) {
    const resp = await fetch(APPS_SCRIPT_WEBAPP_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-webapp-secret': APPS_SCRIPT_SECRET
        },
        body: JSON.stringify({ action: 'getFortune', userId, secret: APPS_SCRIPT_SECRET })
    });

    const text = await resp.text();
    if (!resp.ok) {
        throw new Error(`WebApp error ${resp.status}: ${text}`);
    }

    let data;
    try {
        data = JSON.parse(text);
    } catch (err) {
        throw new Error(`Failed to parse WebApp response as JSON: ${text}`);
    }
    return data;
}

client.once('ready', async () => {
    console.log('Bot ready:', client.user.tag);
    await registerCommands();
});

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isChatInputCommand() && interaction.commandName === 'register') {
            const modal = new ModalBuilder()
                .setCustomId('registerModal')
                .setTitle('ユーザ登録');

            const birthInput = new TextInputBuilder()
                .setCustomId('birthdate')
                .setLabel('生年月日 (YYYY-MM-DD)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('1990-01-01')
                .setRequired(true);

            const regionInput = new TextInputBuilder()
                .setCustomId('region')
                .setLabel('地域 (例: 関東)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('関東')
                .setRequired(true);

            const row1 = new ActionRowBuilder().addComponents(birthInput);
            const row2 = new ActionRowBuilder().addComponents(regionInput);
            modal.addComponents(row1, row2);
            await interaction.showModal(modal);
            return;
        }

        if (interaction.isModalSubmit() && interaction.customId === 'registerModal') {
            const birth = interaction.fields.getTextInputValue('birthdate').trim();
            const region = interaction.fields.getTextInputValue('region').trim();

            if (!isValidDateString(birth)) {
                await interaction.reply({ content: '生年月日の形式が不正です。YYYY-MM-DD で入力してください。', flags: 64 });
                return;
            }
            if (!region) {
                await interaction.reply({ content: '地域を入力してください。', flags: 64 });
                return;
            }

            await interaction.deferReply({ flags: 64 });
            try {
                const text = await sendRegistrationToWebApp(interaction.user.id, birth, region);
                await interaction.editReply('登録しました。ありがとうございます！');
                console.log('Saved profile:', interaction.user.id, birth, region, '->', text);
            } catch (err) {
                console.error('Failed to save registration row', err);
                await interaction.editReply('保存に失敗しました。管理者に連絡してください。');
            }
            return;
        }

        if (interaction.isChatInputCommand() && interaction.commandName === 'fortune') {
            await interaction.deferReply({ flags: 64 });
            try {
                const data = await getFortuneFromWebApp(interaction.user.id);
                if (!data.success) {
                    if (data.reason === 'NotRegistered') {
                        await interaction.editReply('まだ生年月日が登録されていません。先に `/register` コマンドで登録を行ってください。');
                    } else {
                        await interaction.editReply('占い結果の取得に失敗しました。管理者に連絡してください。');
                    }
                    return;
                }

                const embed = new EmbedBuilder()
                    .setTitle('🔮 本日の占い結果 🔮')
                    .setColor(0x5865F2)
                    .setDescription(
                        `${interaction.user.toString()} さんの本日の運勢です。\n\n` +
                        `# 🏆 総合順位: **${data.overallRank}** 位\n` +
                        `## 💖 幸福度: **${data.happiness}%**\n\n` +
                        `### 🎁 ラッキーアイテム\n${data.luckyItem}\n\n` +
                        `### 📝 今日の一言アドバイス\n${data.advice}\n` +
                        `* * *`
                    )
                    .addFields(
                        { name: '🌟 星座・干支', value: `星座: \`${data.seiza}\` / 干支: \`${data.eto}\` (干支: ${data.zodiacRank}位 / 星座: ${data.constellationRank}位)`, inline: false },
                        { name: '🌡️ 室内環境平均', value: `気温: \`${data.avgTmp}℃\` / 湿度: \`${data.avgHum}%\``, inline: true },
                        { name: '😴 睡眠時間', value: `睡眠時間: \`${data.sleepHours} 時間\``, inline: true },
                        { name: '🌂 降水確率', value: `降水確率: \`${data.rainP}%\``, inline: true },
                        { name: '👤 登録情報', value: `生年月日: \`${data.birthday}\` / 地域: \`${data.region}\``, inline: false }
                    )
                    .setTimestamp();

                if (data.geminiError) {
                    console.warn(`[Gemini Error Debug]: ${data.geminiError}`);
                }

                await interaction.editReply({ embeds: [embed] });
            } catch (err) {
                console.error('Failed to get fortune', err);
                await interaction.editReply('占い結果の取得中にエラーが発生しました。しばらく経ってから再度お試しください。');
            }
            return;
        }
    } catch (err) {
        console.error('interaction handler error', err);
    }
});

client.login(TOKEN);
