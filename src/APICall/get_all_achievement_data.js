import 'dotenv/config';

const API_KEY= process.env.API_KEY

async function get_all_achievement_data(appid) {
    const url = `http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${API_KEY}&appid=${appid}`

    const response = await fetch(url)

    const data = await response.json()

    //console.log(data.game.availableGameStats.achievements)

    return data.game.availableGameStats.achievements
}

export default get_all_achievement_data