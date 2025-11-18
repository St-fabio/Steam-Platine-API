function get_next_platine_advice(games, nb_advice) {
    let most_completed_game = games.sort((a, b) => a.completion - b.completion)

    let most_completed_game_advice = []

    for (let i = 0; i < most_completed_game.length; i++) {
        let ratio = most_completed_game[i]['completion'] / most_completed_game[i]['remaining']
        
        most_completed_game_advice.push({"game":most_completed_game[i]['game']["name"], "ratio":ratio})
    }

    let advice = most_completed_game_advice.sort((a, b) => a.ratio - b.ratio).slice(-nb_advice)

    return advice
}

export default get_next_platine_advice