import categories_data from "../data/categories.json" with { type: "json" };

import { writeFileSync } from 'fs';

export function getCategories(req, res) {
    const categories = categories_data.categories;
    res.send(categories);
}

export function getCategory(req, res) {
    const categoryId = req.params.categoryId;

    const category = categories_data.categories[categoryId];

    if (!category) {
        res.status(404).send("Category not found");
        return;
    }

    res.send(category);
}

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

export function deleteCategory(req, res) {
    const categoryId = req.params.categoryId;

    delete categories_data.categories[categoryId];

    writeFileSync('./data/categories.json', JSON.stringify(categories_data, null, 2));
    res.send("category deleted successfully.");
}

export function getCategoryGames(req, res) {
    const categoryId = req.params.categoryId;
    const category = categories_data.categories[categoryId];

    if (!category) {
        res.status(404).send("Category not found");
        return;
    }

    res.send(category.games);
}

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

export function getCategoryStats(req, res) {
    res.send("not implemented");
}

export function refreshCategoryStats(req, res) {
    res.send("not implemented");
}