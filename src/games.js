import games_data from "../data/games.json" with { type: "json" };
import achievements_data from "../data/achievements.json" with { type: "json" };
import get_all_achievement_data from "./APICall/get_all_achievement_data.js";

import { writeFileSync } from 'fs';

/**
 * Send all games available
 * @param {*} req empty
 * @param {*} res JSON with all games and their appid and name
 */
export function getGames(req, res) {

    const games = []

    for (const game in games_data.games) {
        games.push({game: games_data.games[game], routes: [`get games/${games_data.games[game].appid}`]});
    }

    res.send(games);
}

/**
 * Send details of a specific game
 * @param {*} req contains gameId in params
 * @param {*} res JSON with game details and available routes
 */
export function getGame(req, res) {
    res.send({game: games_data.games[req.params.gameId], routes: [`get games/${req.params.gameId}/achievements`, `post games/${req.params.gameId}/achievements`]});
}

/**
 * Send achievements of a specific game
 * @param {*} req contains gameId in params
 * @param {*} res JSON with game achievements
 */
export function getGameAchievements(req, res) {
    const gameId = req.params.gameId;
    const game = games_data.games[gameId];

    let achievements = [];
    const response = {};

    if (game) {
        achievements = achievements_data.games[req.params.gameId] || [];

        for (let i = 0; i < achievements_data.games[gameId].length; i++) {
            response[achievements_data.games[gameId][i].name] = {achievement: {name: achievements_data.games[gameId][i].name, display_name: achievements_data.games[gameId][i].display_name, description: achievements_data.games[gameId][i].description}, routes: [`get games/${gameId}/achievements/${achievements_data.games[gameId][i].name}`]};   
        }
    }

    res.send(response);
}

/**
 * Refresh achievements of a specific game
 * @param {*} req contains gameId in params
 * @param {*} res confirmation message
 */
export async function refreshGameAchievements(req, res) {
    const gameId = req.params.gameId;

    const all_achievements = await get_all_achievement_data(gameId)

    achievements_data.games[gameId] = all_achievements;

    writeFileSync('./data/achievements.json', JSON.stringify(achievements_data, null, 2));
    res.send("Game achievements refreshed successfully.");
}

/**
 * Send details of a specific achievement of a game
 * @param {*} req contains gameId and achievement name in params
 * @param {*} res JSON with achievement details
 */
export function getGameAchievementInfo(req, res) {
    const gameId = req.params.gameId;
    const achievementName = req.params.achievement;

    const game_achievements = achievements_data.games[gameId] || [];


    const achievement = game_achievements.find(a => a.name === achievementName);
    res.send(achievement);
}