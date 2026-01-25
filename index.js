import express from "express";
import { addUser, getUser, getUserGameAchievements, getUserGames, getUserPlatinumAdvices, getUserPlatinums, getUsers, getUserStats, refreshUserGames, refreshUserPlatinums, updateUser, getUserFriends, addUserFriend, deleteUserFriend, refreshUserStats } from "./src/users.js";
import { getGame, getGameAchievementInfo, getGameAchievements, getGames, refreshGameAchievements } from "./src/games.js";
import { addCategory, addCategoryGames, deleteCategory, getCategories, getCategory, getCategoryGames, getCategoryStats, refreshCategoryStats } from "./src/category.js";
import cors from "cors";
import bcrypt from "bcrypt";
import { z } from "zod";
import { signAccessToken } from "./src/auth/token.js";
import { getDb } from "./src/mongodb/mongo.js";
import { requireAuth } from "./src/auth/middleware.js";

const app = express();

await (async () => {
  const db = await getDb();

  await db.collection("users").createIndex({ steamId: 1 }, { unique: true });
  await db.collection("games").createIndex({ appid: 1 }, { unique: true });
  await db.collection("achievements").createIndex({ appid: 1, name: 1 }, { unique: true });

  console.log("[mongo] indexes ensured");
})();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.send("Welcome on Steam Platine API !");
});

// Users endpoints
app.get("/users", getUsers);
app.get("/users/:userId", getUser);
app.post("/users/:userId", updateUser);
app.put("/users/:userId", addUser);
app.get("/users/:userId/games/", getUserGames);
app.post("/users/:userId/games/", refreshUserGames);
app.get("/users/:userId/games/:gameId/achievements", getUserGameAchievements);
app.get("/users/:userId/platinums", getUserPlatinums);
app.post("/users/:userId/platinums", refreshUserPlatinums);
app.get("/users/:userId/stats", getUserStats);
app.post("/users/:userId/stats", refreshUserStats);
app.get("/users/:userId/platinum_advice", getUserPlatinumAdvices);
app.get("/users/:userId/friends", getUserFriends);
app.put("/users/:userId/friends", requireAuth, addUserFriend);
app.delete("/users/:userId/friends", requireAuth, deleteUserFriend);


// Games endpoints
app.get("/games", getGames);
app.get("/games/:gameId", getGame);
app.get("/games/:gameId/achievements", getGameAchievements);
app.post("/games/:gameId/achievements", refreshGameAchievements);
app.get("/games/:gameId/achievements/:achievement", getGameAchievementInfo);


// Category endpoints
app.get("/categories", getCategories);
app.get("/categories/:categoryId", getCategory);
app.post("/categories/:name", addCategory);
app.delete("/categories/:categoryId", deleteCategory);
app.get("/categories/:categoryId/games", getCategoryGames);
app.post("/categories/:categoryId/games", addCategoryGames);
app.get("/categories/:categoryId/stats", getCategoryStats);
app.post("/categories/:categoryId/stats", refreshCategoryStats);

// Auth endpoint

const loginSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(200),
});

app.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const { username, password } = parsed.data;

  const db = await getDb();
  const user = await db.collection("users").findOne(
    { username: username.toLowerCase() },
    { projection: { passwordHash: 1, username: 1 } }
  );

  // réponse volontairement vague (anti user enumeration)
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const accessToken = signAccessToken({
    userId: String(user._id),
    username: user.username,
  });

  return res.json({
    accessToken,
    user: {
      id: String(user._id),
      username: user.username,
    },
  });
});