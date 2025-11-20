import categories_data from "../data/categories.json" with { type: "json" };

import { writeFileSync } from 'fs';

/**
 * Send the list of categories
 * @param {*} req empty
 * @param {*} res JSON with all categories
 */
export function getCategories(req, res) {
    const categories = categories_data.categories;

    const categories_response = {}

    for (let i = 0; i < categories.length; i++) {
        categories_response[categories[i].id] = {category: {id: categories[i].id, name: categories[i].name}, routes: ['get /categories/' + categories[i].id, 'delete /categories/' + categories[i].id, 'post /categories/categoryName', 'get /categories/' + categories[i].id + '/stats', 'post /categories/' + categories[i].id + '/stats']};
    }
    res.send(categories_response);
}

/**
 * Send details of a specific category
 * @param {*} req contains categoryId in params
 * @param {*} res JSON with category details
 */
export function getCategory(req, res) {
    const categoryId = req.params.categoryId;

    const category = categories_data.categories[categoryId];

    if (!category) {
        res.status(404).send("Category not found");
        return;
    }

    res.send({category: {id: category.id, name: category.name}, routes: ['get /categories/' + category.id + '/games', 'post /categories/' + category.id + '/games']});
}

/**
 * Add a new category
 * @param {*} req contains name in params
 * @param {*} res confirmation message
 */
export function addCategory(req, res) {
    const categoryName = req.params.name;
    const categoryId = categories_data.last_id + 1;
    categories_data.last_id = categoryId;

    const category = {
        id: categoryId,
        name: categoryName,
        games: []
    }

    categories_data.categories[categoryId] = category;

    writeFileSync('./data/categories.json', JSON.stringify(categories_data, null, 2));
    res.send("category added successfully.");
}

/**
 * Delete a category
 * @param {*} req contains categoryId in params
 * @param {*} res confirmation message
 */
export function deleteCategory(req, res) {
    const categoryId = req.params.categoryId;

    delete categories_data.categories[categoryId];

    writeFileSync('./data/categories.json', JSON.stringify(categories_data, null, 2));
    res.send("category deleted successfully.");
}

/**
 * Send the list of games in a specific category
 * @param {*} req contains categoryId in params
 * @param {*} res JSON with games in the category
 */
export function getCategoryGames(req, res) {
    const categoryId = req.params.categoryId;
    const category = categories_data.categories[categoryId];

    if (!category) {
        res.status(404).send("Category not found");
        return;
    }

    res.send(category.games);
}

/**
 * Add games to a specific category
 * @param {*} req contains categoryId in params and gameIds in body
 * @param {*} res confirmation message
 */
export function addCategoryGames(req, res) {
    const categoryId = req.params.categoryId;
    const gameIds = req.body.gameIds;

    const game = categories_data.categories[categoryId];

    if (!game) {
        res.status(404).send("Category not found");
        return;
    }

    game.games.push(...gameIds);

    writeFileSync('./data/categories.json', JSON.stringify(categories_data, null, 2));
    res.send("Games added to category successfully.");
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