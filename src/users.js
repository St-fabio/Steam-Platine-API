import users_data from "../data/users.json" with { type: "json" };
import games_data from "../data/games.json" with { type: "json" };
import achievements_data from "../data/achievements.json" with { type: "json" };

import get_player_achievement from "./APICall/get_player_achievement.js";
import get_all_games from "./APICall/get_all_games.js";
import get_all_achievement_data from "./APICall/get_all_achievement_data.js";get_all_achievement_data

import { writeFileSync } from 'fs';
import get_next_platine_advice from "./functions/get_next_platine_advice.js";

export function getUsers(req, res) {
    const users = users_data.users;

    const response = {};

    for (const userId in users) {
        response[userId] = {steamId: users[userId].steamId, username: users[userId].username, routes: [`get /users/${userId}`]};
    }
    res.send(response);
}

export function getUser(req, res) {
    const userId = req.params.userId;
    const user = users_data.users[userId];

    res.send({user: {steamId: user.steamId, username: user.username}, routes: [`get /users/${userId}/games`, `post /users/${userId}/games`, `get /users/${userId}/platinums`, `post /users/${userId}/platinums`, `get /users/${userId}/stats`, `get /users/${userId}/platinum_advice`, `get /users/${userId}/friends`, `post /users/${userId}/friends`, `delete /users/${userId}/friends`]});
}

export function addUser(req, res) {
    const userId = req.params.userId;

    const name = req.body.name;
    
    const user = {steamId: userId, username: name, platine: [], games: []}

    users_data.users[userId] = user;

    writeFileSync('./data/users.json', JSON.stringify(users_data, null, 2));

    res.send("User added successfully");
}

export function updateUser(req, res) {
    res.send("Not implemented yet");
}

export async function getUserGames(req, res) {
    const userId = req.params.userId;
    const games = users_data.users[userId].games

    const gameFullData =  []

    for (let i = 0; i < games.length; i++) {
        gameFullData.push({game: games_data.games[games[i]], routes: [`get /users/${userId}/games/${games[i]}/achievements`]});
    }

    res.send(gameFullData);
}

export async function refreshUserGames(req, res) {
    const userId = req.params.userId;

    const games = await get_all_games(userId)

    console.log(games);

    const games_appids = [] 

    for (let i = 0; i < games.length; i++) {
        games_appids.push(games[i].appid);
        games_data.games[games[i].appid] = {appid: games[i].appid, name: games[i].name, have_success: games[i].has_community_visible_stats || false};
    }

    users_data.users[userId].games = games_appids;

    writeFileSync('./data/games.json', JSON.stringify(games_data, null, 2));
    writeFileSync('./data/users.json', JSON.stringify(users_data, null, 2));

    res.send("User games refreshed successfully");
}

export async function getUserGameAchievements(req, res) {
    const userId = req.params.userId;
    const gameId = req.params.gameId;

    const game = await get_player_achievement(gameId, userId)

    let all_achievements

    if (!achievements_data.games[gameId]) { 
        all_achievements = await get_all_achievement_data(gameId)

        achievements_data.games[gameId] = all_achievements;

        writeFileSync('./data/achievements.json', JSON.stringify(achievements_data, null, 2));
    }

    res.send(game);
}

export function getUserPlatinums(req, res) {
    const userId = req.params.userId;

    res.send(users_data.users[userId].platine);res.send(users_data[userId].platine);
}

export async function refreshUserPlatinums(req, res) {
    const userId = req.params.userId;

    const platinedGames = []

    for (let i = 0; i < users_data.users[userId].games.length; i++) {
        setTimeout(() => {}, 10);
        const game = await get_player_achievement(users_data.users[userId].games[i], userId)

        let platined = true

        if (game) {
            for (let j = 0; j < game.length; j++) {
                if (game[j].achieved === 0) {
                    platined = false
                }
            }

            if (platined) {
                platinedGames.push(games_data.games[users_data.users[userId].games[i]]);
            }   
        }
    }

    const user = users_data.users[userId];
    
    user["platine"] = platinedGames

    users_data.users[userId] = user;

    writeFileSync('./data/users.json', JSON.stringify(users_data, null, 2));

    res.send("récup done");
}

export async function getUserStats(req, res) {
    const userId = req.params.userId;

    const stats = users_data.users[userId].stats;

    res.send(stats);
}

export async function refreshUserStats(req, res) {
    const userId = req.params.userId;

    const nb_platine = users_data.users[userId].platine.length;

    const nb_games = users_data.users[userId].games.length;

    let nb_games_with_achievements = 0;
    const games = users_data.users[userId].games;
    for (let i = 0; i < games.length; i++) {
        if (games_data.games[games[i]].have_success) {
            nb_games_with_achievements++;
        }
    }

    let ratios = [];

    for (let i = 0; i < users_data.users[userId].games.length; i++) {
        setTimeout(() => {}, 10);
        const game = await get_player_achievement(users_data.users[userId].games[i], userId)

        let nb_success = 0;

        if (game) {
            for (let j = 0; j < game.length; j++) {
                if (game[j].achieved === 1) {
                    nb_success++;
                }
            } 
            const ratio = nb_success / game.length;
            ratios.push(ratio);
        }
    }

    const average_ratio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    
    const user = users_data.users[userId];

    user["stats"] = {
        "nb_platine": nb_platine,
        "nb_games": nb_games,
        "platine_percentage": ((nb_platine / nb_games_with_achievements) * 100).toFixed(2),
        "achievement_percentage": (average_ratio * 100).toFixed(2)
    }

    users_data.users[userId] = user;

    writeFileSync('./data/users.json', JSON.stringify(users_data, null, 2));

    res.send("Stats refreshed successfully");
}

export async function getUserPlatinumAdvices(req, res) {
    const userId = req.params.userId;

    const game_not_completed = []

    for (let i = 0; i < users_data.users[userId].games.length; i++) {
        let is_platined = false;
        for (let j = 0; j < users_data.users[userId].platine.length; j++) {
            if (users_data.users[userId].games[i] === users_data.users[userId].platine[j].appid) {
                is_platined = true;
            }
        }
        if (!is_platined) {
            let result = await get_player_achievement(games_data.games[users_data.users[userId].games[i]].appid, userId);

            if (result != undefined) {
                let nb_remaining_achievement = 0;
                let last_achievement = 0;

                for (let i = 0; i < result.length; i++) {
                    if (result[i].achieved == 0) {
                        nb_remaining_achievement++
                    }
                    if (result[i].unlocktime > last_achievement) {
                        last_achievement = result[i].unlocktime
                    }
                }

                const average =  ((result.length - nb_remaining_achievement) / result.length) * 100

                game_not_completed.push({"game": games_data.games[users_data.users[userId].games[i]], "completion": average, "remaining": nb_remaining_achievement});
            }
        }
    }

    const advices = get_next_platine_advice(game_not_completed, 5);
    
    res.send(advices);
}

export function getUserFriends(req, res) {
    const userId = req.params.userId;
    
    res.send(users_data.users[userId].friends || []);
}

export function addUserFriend(req, res) {
    const userId = req.params.userId;

    console.log(req.body);

    const friendId = req.body.friendId;

    console.log(friendId);

    if (!users_data.users[userId].friends) {
        users_data.users[userId].friends = [];
    }

    if (!users_data.users[userId].friends.includes(friendId)) {
        users_data.users[userId].friends.push(friendId);

        writeFileSync('./data/users.json', JSON.stringify(users_data, null, 2));
    }

    res.send("Friend added successfully");
}

export function deleteUserFriend(req, res) {
    const userId = req.params.userId;
    const friendId = req.query.friendId;

    if (users_data.users[userId].friends) {
        for (let i = 0; i < users_data.users[userId].friends.length; i++) {
            if (users_data.users[userId].friends[i] === friendId) {
                users_data.users[userId].friends.splice(i, 1);
            }
        }

        writeFileSync('./data/users.json', JSON.stringify(users_data, null, 2));
    }

    res.send("Friend deleted successfully");
}