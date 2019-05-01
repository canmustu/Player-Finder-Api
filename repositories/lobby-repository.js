const mongoose = require('mongoose');
const crypto = require('crypto');
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');
const keys = require('../config/keys');
const jwt = require('jsonwebtoken');

const Lobby = require('../models/lobby-model');

get_lobbies = function (game_id, callback) {
    // check if username exists
    Lobby.find({ "game.id": game_id }, (error, lobbies) => {
        // if error
        if (error) return callback({ code: 1001 }, null);
        // if lobbies exist
        else if (lobbies) {
            return callback(null, { success: true, lobbies: lobbies });
        }
        // if lobby not exist
        else {
            return callback({ code: 3001 }, null);
        }
    });
}

create_lobby = function (lobby, callback) {
    lobby
        .save()
        .then((new_lobby) => {
            // insertion successful
            return callback(null, { success: true, lobby: new_lobby });
        })
        .catch(() => {
            return callback({ code: 5002 });
        });
}

module.exports = {
    get_lobbies: get_lobbies,
    create_lobby: create_lobby
}
