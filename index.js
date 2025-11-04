import express from "express";
import { addUser, getUser, getUserGameAchievements, getUserGames, getUserPlatinumAdvices, getUserPlatinums, getUsers, getUserStats, refreshUserGames, updateUser } from "./src/users.js";
import { getGame, getGameAchievementInfo, getGameAchievements, getGames } from "./src/games.js";
import { getCategories, getCategory, getCategoryGames, getCategoryStats, refreshCategoryStats } from "./src/category.js";

const app = express();

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
app.get("/users/:userId/stats", getUserStats);
app.get("/users/:userId/platinum_advice", getUserPlatinumAdvices);


// Games endpoints
app.get("/games", getGames);
app.get("/games/:gameId", getGame);
app.get("/games/:gameId/achievements", getGameAchievements);
app.get("/games/:gameId/achievements/:achievement", getGameAchievementInfo);


// Category endpoints
app.get("/categories", getCategories);
app.get("/categories/:categoryId", getCategory);
app.get("/categories/:categoryId/games", getCategoryGames);
app.get("/categories/:categoryId/stats", getCategoryStats);
app.post("/categories/:categoryId/stats", refreshCategoryStats);

app.listen(3000, () => {
  console.log("Server is running on port http://localhost:3000");
});