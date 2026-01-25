import get_player_achievement from "./APICall/get_player_achievement.js";
import get_all_games from "./APICall/get_all_games.js";
import get_all_achievement_data from "./APICall/get_all_achievement_data.js";get_all_achievement_data

import get_next_platine_advice from "./functions/get_next_platine_advice.js";
import { getDb } from "./mongodb/mongo.js";

import bcrypt from "bcrypt";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(8).max(200),
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Send all the users in the database
 * @param {*} req empty 
 * @param {*} res JSON with all users and their steamId and username
 */
export async function getUsers(req, res) {
  const db = await getDb();

  const users = await db.collection("users")
    .find({}, { projection: { _id: 1, username: 1 } })
    .toArray();

  const response = {};
  for (const u of users) {
    response[u._id] = {
      steamId: u._id,
      username: u.username,
      routes: [`get /users/${u._id}`],
    };
  }

  res.send(response);
}

/**
 * Send details of a specific user
 * @param {*} req contains userId in params
 * @param {*} res JSON with user details and available routes
 */
export async function getUser(req, res) {
  const db = await getDb();
  const userId = req.params.userId;

  const user = await db.collection("users").findOne(
    { _id: userId },
    { projection: { _id: 1, username: 1 } }
  );

  if (!user) return res.status(404).send({ error: "User not found" });

  res.send({
    user: { steamId: user._id, username: user.username },
    routes: [
      `get /users/${userId}/games`,
      `post /users/${userId}/games`,
      `get /users/${userId}/platinums`,
      `post /users/${userId}/platinums`,
      `get /users/${userId}/stats`,
      `get /users/${userId}/platinum_advice`,
      `get /users/${userId}/friends`,
      `post /users/${userId}/friends`,
      `delete /users/${userId}/friends`,
    ],
  });
}


/**
 * Add a new user
 * @param {*} req contains userId in params and name in body
 * @param {*} res confirmation message
 */
export async function addUser(req, res) {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const db = await getDb();
  const steamId = req.params.userId; // OK si SteamID fiable

  const { username, password } = parsed.data;

  const passwordHash = await bcrypt.hash(password, 12);

  const doc = {
    _id: steamId,
    username: username,
    passwordHash,

    platine: [],
    games: [],
    friends: [],
    stats: null,

    createdAt: new Date(),
  };

  try {
    await db.collection("users").insertOne(doc);
    return res.status(201).send("User created");
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).send("User already exists");
    }
    throw e;
  }
}


/**
 * Update an existing user
 * @param {*} req contains userId in params and updated data in body
 * @param {*} res confirmation message
 */
export function updateUser(req, res) {
    res.send("Not implemented yet");
}

/** 
 * Get all games of a specific user
 * @param {*} req contains userId in params
 * @param {*} res JSON with user's games and available routes
 */
export async function getUserGames(req, res) {
  const db = await getDb();
  const userId = req.params.userId;

  const user = await db.collection("users").findOne(
    { _id: userId },
    { projection: { games: 1 } }
  );
  if (!user) return res.status(404).send({ error: "User not found" });

  const appids = user.games ?? [];

  const games = await db.collection("games")
    .find({ appid: { $in: appids } }, { projection: { _id: 0 } })
    .toArray();

  // Pour garder l’ordre de appids (optionnel)
  const byAppid = new Map(games.map(g => [g.appid, g]));
  const response = appids
    .map(appid => byAppid.get(appid))
    .filter(Boolean)
    .map(g => ({ game: g, routes: [`get /users/${userId}/games/${g.appid}/achievements`] }));

  res.send(response);
}


/**
 * Refresh the list of games for a specific user
 * @param {*} req contains userId in params
 * @param {*} res confirmation message
 */
export async function refreshUserGames(req, res) {
  const db = await getDb();
  const userId = req.params.userId;

  const games = await get_all_games(userId);

  const appids = [];
  const bulk = db.collection("games").initializeUnorderedBulkOp();

  for (const g of games) {
    appids.push(g.appid);
    bulk.find({ appid: g.appid }).upsert().updateOne({
      $set: { appid: g.appid, name: g.name, have_success: g.has_community_visible_stats || false },
    });
  }

  if (games.length) await bulk.execute();

  await db.collection("users").updateOne(
    { _id: userId },
    { $set: { games: appids } }
  );

  res.send("User games refreshed successfully");
}


/**
 * Get achievements of a specific game for a specific user
 * @param {*} req contains userId and gameId in params
 * @param {*} res JSON with game achievements
 */
export async function getUserGameAchievements(req, res) {
  try {
    const userId = req.params.userId;
    const gameId = Number(req.params.gameId); // appid en nombre

    // 1) Achievements du joueur (ce que tu renvoies)
    const playerAchievements = await get_player_achievement(gameId, userId);

    // 2) Cache Mongo des achievements du jeu (définitions)
    const db = await getDb();
    const achievementsCol = db.collection("achievements");

    // Si aucune définition en DB pour ce jeu, on la récupère et on l'enregistre
    const alreadyCached = await achievementsCol.findOne(
      { appid: gameId },
      { projection: { _id: 1 } }
    );

    if (!alreadyCached) {
      const allAchievements = await get_all_achievement_data(gameId);

      if (Array.isArray(allAchievements) && allAchievements.length > 0) {
        // Insert en masse + ignore duplicates au cas où (course condition)
        // On normalise les champs utiles.
        const docs = allAchievements.map((a) => ({
          appid: gameId,
          name: a.name,
          display_name: a.display_name,
          description: a.description,
          // garde d'autres champs si présents
          icon: a.icon,
          icongray: a.icongray,
          hidden: a.hidden,
        }));

        try {
          await achievementsCol.insertMany(docs, { ordered: false });
        } catch (e) {
          // Si index unique, insertMany peut lever des duplicate key en course condition.
          // On ignore si c'est juste des doublons.
          if (e?.code !== 11000) throw e;
        }
      }
    }

    return res.send(playerAchievements);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}


/**
 * Get the list of platined games for a specific user
 * @param {*} req contains userId in params
 * @param {*} res JSON with user's platined games
 */
export async function getUserPlatinums(req, res) {
  const db = await getDb();
  const userId = req.params.userId;

  const user = await db.collection("users").findOne(
    { _id: userId },
    { projection: { platine: 1 } }
  );

  if (!user) return res.status(404).json({ error: "User not found" });

  res.send(user.platine ?? []);
}

/**
 * Refresh the list of platined games for a specific user
 * @param {*} req contains userId in params
 * @param {*} res confirmation message
 */
export async function refreshUserPlatinums(req, res) {
  try {
    const db = await getDb();
    const userId = req.params.userId;

    // 1) Récupère la liste des appids du user
    const user = await db.collection("users").findOne(
      { _id: userId },
      { projection: { games: 1 } }
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    const userGames = user.games ?? [];
    const platinedAppids = [];

    // 2) Pour chaque jeu, check si tous les achievements sont achieved=1
    for (const appid of userGames) {
      // petit throttle optionnel pour éviter de spam l'API Steam
      await sleep(50);

      const ach = await get_player_achievement(appid, userId);

      if (!ach || !Array.isArray(ach) || ach.length === 0) continue;

      let platined = true;
      for (const a of ach) {
        if (a.achieved === 0) {
          platined = false;
          break;
        }
      }

      if (platined) platinedAppids.push(appid);
    }

    // 3) Récupère les infos des jeux en DB (games collection)
    let platinedGames = [];
    if (platinedAppids.length > 0) {
      platinedGames = await db.collection("games")
        .find({ appid: { $in: platinedAppids } }, { projection: { _id: 0 } })
        .toArray();
    }

    console.log(platinedGames.length)

    // 4) Sauvegarde dans l'utilisateur
    await db.collection("users").updateOne(
      { _id: userId },
      { $set: { platine: platinedGames } }
    );

    res.send("récup done");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}


/**
 * Get stats of a specific user
 * @param {*} req contains userId in params
 * @param {*} res JSON with user's stats
 */
export async function getUserStats(req, res) {
  const db = await getDb();
  const userId = req.params.userId;

  const user = await db.collection("users").findOne(
    { _id: userId },
    { projection: { stats: 1 } }
  );

  console.log(user.stats)

  if (!user) return res.status(404).json({ error: "User not found" });

  res.send(user.stats ?? null);
}

/**
 * Refresh stats of a specific user
 * @param {*} req contains userId in params
 * @param {*} res confirmation message
 */
export async function refreshUserStats(req, res) {
  try {
    const db = await getDb();
    const userId = req.params.userId;

    // Récup user (games + platine)
    const user = await db.collection("users").findOne(
      { _id: userId },
      { projection: { games: 1, platine: 1 } }
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    const gamesAppids = user.games ?? [];
    const nb_games = gamesAppids.length;

    // platine = objets games (ton choix actuel)
    const nb_platine = (user.platine ?? []).length;

    // Compte des jeux ayant des achievements (have_success=true)
    // (plus fiable que relire côté users)
    const nb_games_with_achievements = await db.collection("games").countDocuments({
      appid: { $in: gamesAppids },
      have_success: true,
    });

    // Ratios d'achievements (Steam API)
    const ratios = [];

    for (const appid of gamesAppids) {
      await sleep(50); // throttle léger

      const ach = await get_player_achievement(appid, userId);
      if (!ach || !Array.isArray(ach) || ach.length === 0) continue;

      let nb_success = 0;
      for (const a of ach) {
        if (a.achieved === 1) nb_success++;
      }

      ratios.push(nb_success / ach.length);
    }

    const average_ratio =
      ratios.length > 0 ? ratios.reduce((a, b) => a + b, 0) / ratios.length : 0;

    const platine_percentage =
      nb_games_with_achievements > 0
        ? ((nb_platine / nb_games_with_achievements) * 100).toFixed(2)
        : "0.00";

    const achievement_percentage = (average_ratio * 100).toFixed(2);

    const stats = {
      nb_platine,
      nb_games,
      platine_percentage,
      achievement_percentage,
    };

    // Sauvegarde en DB
    await db.collection("users").updateOne(
      { _id: userId },
      { $set: { stats } }
    );

    res.send("Stats refreshed successfully");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}


/**
 * Get platinum advice for a specific user
 * @param {*} req contains userId in params
 * @param {*} res JSON with platinum advice
 */
export async function getUserPlatinumAdvices(req, res) {
  try {
    const db = await getDb();
    const userId = req.params.userId;

    const user = await db.collection("users").findOne(
      { _id: userId },
      { projection: { games: 1, platine: 1 } }
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    const userGames = user.games ?? [];
    const userPlatine = user.platine ?? [];

    const platinedAppids = new Set(userPlatine.map((g) => g.appid));

    const games = await db.collection("games")
      .find({ appid: { $in: userGames } }, { projection: { _id: 0 } })
      .toArray();

    const gameByAppid = new Map(games.map((g) => [g.appid, g]));

    const game_not_completed = [];

    for (let i = 0; i < userGames.length; i++) {
      const appid = userGames[i];

      let is_platined = false;
      for (let j = 0; j < userPlatine.length; j++) {
        if (appid === userPlatine[j].appid) {
          is_platined = true;
        }
      }

      if (!is_platined) {
        const gameObj = gameByAppid.get(appid);
        if (!gameObj) continue;

        const result = await get_player_achievement(gameObj.appid, userId);

        if (result != undefined) {
          let nb_remaining_achievement = 0;
          let last_achievement = 0;

          for (let k = 0; k < result.length; k++) {
            if (result[k].achieved == 0) nb_remaining_achievement++;
            if (result[k].unlocktime > last_achievement) last_achievement = result[k].unlocktime;
          }

          const average = ((result.length - nb_remaining_achievement) / result.length) * 100;

          game_not_completed.push({
            game: gameObj,
            completion: average,
            remaining: nb_remaining_achievement,
          });
        }
      }
    }

    const advices = get_next_platine_advice(game_not_completed, 5);
    res.send(advices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get friends of a specific user
 * @param {*} req contains userId in params
 * @param {*} res JSON with user's friends
 */
export async function getUserFriends(req, res) {
  try {
    const db = await getDb();
    const userId = req.params.userId;

    const user = await db.collection("users").findOne(
      { _id: userId },
      { projection: { friends: 1 } }
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    res.send(user.friends || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Add a friend to a specific user
 * @param {*} req contains userId in params and friendId in body
 * @param {*} res confirmation message
 */
export async function addUserFriend(req, res) {
  try {
    const db = await getDb();
    const userId = req.params.userId;
    const friendId = req.body?.friendId;

    if (!friendId) {
      return res.status(400).json({ error: "Missing friendId" });
    }

    const result = await db.collection("users").updateOne(
      { _id: userId },
      { $addToSet: { friends: friendId } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.send("Friend added successfully");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Delete a friend from a specific user
 * @param {*} req contains userId in params and friendId in query
 * @param {*} res confirmation message
 */
export async function deleteUserFriend(req, res) {
  try {
    const db = await getDb();
    const userId = req.params.userId;
    const friendId = req.query.friendId;

    if (!friendId) {
      return res.status(400).json({ error: "Missing friendId" });
    }

    const result = await db.collection("users").updateOne(
      { _id: userId },
      { $pull: { friends: friendId } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.send("Friend deleted successfully");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}