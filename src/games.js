import games_data from "../data/games.json" with { type: "json" };
import achievements_data from "../data/achievements.json" with { type: "json" };
import get_all_achievement_data from "./APICall/get_all_achievement_data.js";

import { writeFileSync } from 'fs';
import {getDb} from "./mongodb/mongo.js"

/**
 * Send all games available
 * @param {*} req empty
 * @param {*} res JSON with all games and their appid and name
 */
export async function getGames(req, res) {
  try {
    const db = await getDb();

    const games = await db.collection("games")
      .find({}, { projection: { _id: 0 } })
      .sort({ name: 1 })
      .toArray();

    res.send(
      games.map((g) => ({
        game: g,
        routes: [`get games/${g.appid}`],
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Send details of a specific game
 * @param {*} req contains gameId in params
 * @param {*} res JSON with game details and available routes
 */
export async function getGame(req, res) {
  try {
    const db = await getDb();
    const gameId = Number(req.params.gameId);

    const game = await db.collection("games").findOne(
      { appid: gameId },
      { projection: { _id: 0 } }
    );

    if (!game) return res.status(404).json({ error: "Game not found" });

    res.send({
      game,
      routes: [
        `get games/${gameId}/achievements`,
        `post games/${gameId}/achievements`,
      ],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Send achievements of a specific game
 * @param {*} req contains gameId in params
 * @param {*} res JSON with game achievements
 */
export async function getGameAchievements(req, res) {
  try {
    const db = await getDb();
    const gameId = Number(req.params.gameId);

    // vérifie que le jeu existe (optionnel, mais proche de ton ancienne logique)
    const game = await db.collection("games").findOne(
      { appid: gameId },
      { projection: { _id: 1 } }
    );

    const response = {};
    if (!game) return res.send(response);

    const achs = await db.collection("achievements")
      .find({ appid: gameId }, { projection: { _id: 0 } })
      .toArray();

    for (const a of achs) {
      response[a.name] = {
        achievement: {
          name: a.name,
          display_name: a.display_name,
          description: a.description,
        },
        routes: [`get games/${gameId}/achievements/${a.name}`],
      };
    }

    res.send(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Refresh achievements of a specific game
 * @param {*} req contains gameId in params
 * @param {*} res confirmation message
 */
export async function refreshGameAchievements(req, res) {
  try {
    const db = await getDb();
    const gameId = Number(req.params.gameId);

    const all_achievements = await get_all_achievement_data(gameId);

    // si Steam ne renvoie rien / erreur, évite de casser
    if (!Array.isArray(all_achievements)) {
      return res.status(502).json({ error: "Steam API returned invalid data" });
    }

    // Remplace le cache : delete puis insert (simple, efficace)
    await db.collection("achievements").deleteMany({ appid: gameId });

    if (all_achievements.length > 0) {
      await db.collection("achievements").insertMany(
        all_achievements.map((a) => ({
          appid: gameId,
          name: a.name,
          display_name: a.display_name,
          description: a.description ?? "",
          icon: a.icon,
          icongray: a.icongray,
          hidden: a.hidden,
        })),
        { ordered: false }
      );
    }

    res.send("Game achievements refreshed successfully.");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}
/**
 * Send details of a specific achievement of a game
 * @param {*} req contains gameId and achievement name in params
 * @param {*} res JSON with achievement details
 */
export async function getGameAchievementInfo(req, res) {
  try {
    const db = await getDb();
    const gameId = Number(req.params.gameId);
    const achievementName = req.params.achievement;

    const achievement = await db.collection("achievements").findOne(
      { appid: gameId, name: achievementName },
      { projection: { _id: 0 } }
    );

    if (!achievement) return res.status(404).json({ error: "Achievement not found" });

    res.send(achievement);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}