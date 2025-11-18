import 'dotenv/config';

const API_KEY= process.env.API_KEY

async function get_player_achievement(appid, steamid) {
    const url = `http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${appid}&key=${API_KEY}&steamid=${steamid}`

    const response = await fetch(url)

    const data = await response.json()

    return data.playerstats.achievements
}

export default get_player_achievement