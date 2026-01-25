import categories_data from "../data/categories.json" with { type: "json" };

import { writeFileSync } from 'fs';

/**
 * Send the list of categories
 * @param {*} req empty
 * @param {*} res JSON with all categories
 */
export async function getCategories(req, res) {
  try {
    const db = await getDb();
    const cats = await db.collection("categories")
      .find({}, { projection: { _id: 0, id: 1, name: 1 } })
      .sort({ id: 1 })
      .toArray();

    const categories_response = {};
    for (const c of cats) {
      categories_response[c.id] = {
        category: { id: c.id, name: c.name },
        routes: [
          `get /categories/${c.id}`,
          `delete /categories/${c.id}`,
          `post /categories/categoryName`,
          `get /categories/${c.id}/stats`,
          `post /categories/${c.id}/stats`,
        ],
      };
    }

    res.send(categories_response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Send details of a specific category
 * @param {*} req contains categoryId in params
 * @param {*} res JSON with category details
 */
export async function getCategory(req, res) {
  try {
    const db = await getDb();
    const categoryId = Number(req.params.categoryId);

    const category = await db.collection("categories").findOne(
      { id: categoryId },
      { projection: { _id: 0, id: 1, name: 1 } }
    );

    if (!category) return res.status(404).send("Category not found");

    res.send({
      category: { id: category.id, name: category.name },
      routes: [
        `get /categories/${category.id}/games`,
        `post /categories/${category.id}/games`,
      ],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Add a new category
 * @param {*} req contains name in params
 * @param {*} res confirmation message
 */
export async function addCategory(req, res) {
  try {
    const db = await getDb();
    const categoryName = req.params.name;

    if (!categoryName) return res.status(400).json({ error: "Missing category name" });

    const categoryId = await nextSequence("categories");

    await db.collection("categories").insertOne({
      id: categoryId,
      name: categoryName,
      games: [],
    });

    res.send("category added successfully.");
  } catch (err) {
    // si tu ajoutes un unique index sur name, tu peux renvoyer 409 ici
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Delete a category
 * @param {*} req contains categoryId in params
 * @param {*} res confirmation message
 */
export async function deleteCategory(req, res) {
  try {
    const db = await getDb();
    const categoryId = Number(req.params.categoryId);

    const r = await db.collection("categories").deleteOne({ id: categoryId });
    if (r.deletedCount === 0) return res.status(404).send("Category not found");

    res.send("category deleted successfully.");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Send the list of games in a specific category
 * @param {*} req contains categoryId in params
 * @param {*} res JSON with games in the category
 */
export async function getCategoryGames(req, res) {
  try {
    const db = await getDb();
    const categoryId = Number(req.params.categoryId);

    const category = await db.collection("categories").findOne(
      { id: categoryId },
      { projection: { _id: 0, games: 1 } }
    );

    if (!category) return res.status(404).send("Category not found");

    res.send(category.games ?? []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Add games to a specific category
 * @param {*} req contains categoryId in params and gameIds in body
 * @param {*} res confirmation message
 */
export async function addCategoryGames(req, res) {
  try {
    const db = await getDb();
    const categoryId = Number(req.params.categoryId);
    const gameIds = req.body?.gameIds;

    if (!Array.isArray(gameIds)) {
      return res.status(400).json({ error: "gameIds must be an array" });
    }

    // équivalent au push(...), mais sans doublons : $addToSet + $each
    const r = await db.collection("categories").updateOne(
      { id: categoryId },
      { $addToSet: { games: { $each: gameIds.map(Number) } } }
    );

    if (r.matchedCount === 0) return res.status(404).send("Category not found");

    res.send("Games added to category successfully.");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Send statistics of a specific category (not implemented)
 * @param {*} req contains categoryId in params
 * @param {*} res JSON with category statistics
 */
export function getCategoryStats(req, res) {
    res.send("not implemented");
}

/**
 * Refresh statistics of a specific category (not implemented)
 * @param {*} req contains categoryId in params
 * @param {*} res confirmation message
 */
export function refreshCategoryStats(req, res) {
    res.send("not implemented");
}