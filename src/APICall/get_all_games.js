import 'dotenv/config';

const API_KEY= process.env.STEAM_API_KEY

async function get_all_games(steamid) {
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${API_KEY}&steamid=${steamid}&include_appinfo=true`;
    const response = await fetch(url);
    const data = await response.json();
    return data.response.games;
}
export default get_all_games;