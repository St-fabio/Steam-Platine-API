import games_data from "../data/games.json" with { type: "json" };
import achievements_data from "../data/achievements.json" with { type: "json" };
import get_all_achievement_data from "./APICall/get_all_achievement_data.js";

import { writeFileSync } from 'fs';

export function getGames(req, res) {
    res.send(Object.values(games_data.games));
}

export function getGame(req, res) {
    res.send(games_data.games[req.params.gameId]);
}

export function getGameAchievements(req, res) {
    const game = games_data.games[req.params.gameId];

    let achievements = [];

    if (game) {
        achievements = achievements_data.games[req.params.gameId] || [];
    }

    res.send(achievements);
}

export async function refreshGameAchievements(req, res) {
    const gameId = req.params.gameId;

    const all_achievements = await get_all_achievement_data(gameId)

    achievements_data.games[gameId] = all_achievements;

    writeFileSync('./data/achievements.json', JSON.stringify(achievements_data, null, 2));
    res.send("not implemented");
}

export function getGameAchievementInfo(req, res) {
    const gameId = req.params.gameId;
    const achievementName = req.params.achievement;

    const game_achievements = achievements_data.games[gameId] || [];


    const achievement = game_achievements.find(a => a.name === achievementName);
    res.send(achievement);
}