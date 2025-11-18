import games_data from "../data/games.json" with { type: "json" };

export function getGames(req, res) {
    res.send(Object.values(games_data.games));
}

export function getGame(req, res) {
    res.send(games_data.games[req.params.gameId]);
}

export function getGameAchievements(req, res) {
    res.send("not implemented");
}

export function getGameAchievementInfo(req, res) {
    res.send("not implemented");
}