const keys = require('../config/keys');
require('../enums/link-type-enum');

const Game = require('../models/game-model');

get_games = function (callback) {
    // check if username exists
    Game.find({}, (error, games) => {
        // if error
        if (error) return callback({ code: 1001 }, null);
        // if games exist
        else if (games) {
            return callback(null, { success: true, games: games });
        }
        // if games not exist
        else {
            return callback({ code: 3001 }, null);
        }
    });
}

module.exports = {
    get_games: get_games
}
