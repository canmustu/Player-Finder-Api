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

get_game = function (game_id, callback) {
    // check if username exists
    Game.findOne({ _id: game_id }, (error, game) => {
        // if error
        if (error) return callback({ code: 1001 }, null);
        // if game exist
        else if (game) {
            return callback(null, { success: true, game: game });
        }
        // if game not exist
        else {
            return callback({ code: 3001 }, null);
        }
    });
}

module.exports = {
    get_games: get_games,
    get_game: get_game
}
