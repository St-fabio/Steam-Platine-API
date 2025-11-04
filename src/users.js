import users_data from "../data/users.json" with { type: "json" };
import games_data from "../data/games.json" with { type: "json" };

export function getUsers(req, res) {
    res.send(users_data);
}

export function getUser(req, res) {
    const userId = req.params.userId;
    const user = users_data.users[userId];

    res.send(user);
}

export function addUser(req, res) {
    res.send("Not implemented yet");
}

export function updateUser(req, res) {
    res.send("Not implemented yet");
}

export function getUserGames(req, res) {
    const userId = req.params.userId;

    const games = users_data.users[userId].games

    const gameFullData =  []

    for (let i = 0; i < games.length; i++) {
        gameFullData.push(games_data.games[games[i]]);
    }

    res.send(gameFullData);
}

export function refreshUserGames(req, res) {
    res.send("Not implemented yet");
}

export function getUserGameAchievements(req, res) {
    res.send("Not implemented yet");
}

export function getUserPlatinums(req, res) {
    res.send("Not implemented yet");
}

export function getUserStats(req, res) {
    res.send("Not implemented yet");
}

export function getUserPlatinumAdvices(req, res) {
    res.send("Not implemented yet");
}