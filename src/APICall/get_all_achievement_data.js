import 'dotenv/config';

const API_KEY= process.env.API_KEY

async function get_all_achievement_data(appid) {
    const url = `http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${API_KEY}&appid=${appid}`

    const response = await fetch(url)

    const data = await response.json()

    const game = data?.game;
    const available = game?.availableGameStats;
    const achievements = available?.achievements;

    if (!Array.isArray(achievements)) {
        return achievements
    }
}

export default get_all_achievement_data