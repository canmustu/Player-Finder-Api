const mongoose = require('mongoose');
const crypto = require('crypto');
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');
const keys = require('../config/keys');
const jwt = require('jsonwebtoken');

const Lobby = require('../models/lobby-model');
const User = require('../models/user-model');

get_lobbies = function (game_id, callback) {
    // check if username exists
    Lobby.find({ "game.id": game_id, type: 1 }, (error, lobbies) => {
        // if error
        if (error) return callback({ code: 1001 }, null);
        // if lobbies exist
        else if (lobbies) {
            return callback(null, { success: true, lobbies: lobbies });
        }
        // if lobby not exist
        else {
            return callback({ code: 5001 }, null);
        }
    });
}

create_lobby = function (lobby, callback) {
    lobby
        .save()
        .then((new_lobby) => {

            // insertion successful
            User.updateOne(
                { _id: new_lobby.owner.id },
                { lobby_id: new_lobby._id },
                (error, result) => {
                    return callback(null, { success: true, lobby: new_lobby });
                });
        })
        .catch(() => {
            return callback({ code: 5002 }, null);
        });
}

get_lobby = function (lobby_id, callback) {
    // check if username exists
    Lobby.findById(lobby_id, (error, lobby) => {
        // if error
        if (error) return callback({ code: 1001 }, null);
        // if lobby exist
        else if (lobby) {
            return callback(null, { success: true, lobby: lobby });
        }
        // if lobby not exist
        else {
            return callback({ code: 5001 }, null);
        }
    });
}

make_deactive_lobby = function (lobby_id, user_id, callback) {
    console.log(lobby_id, user_id);
    // check if username exists
    Lobby.updateOne(
        { _id: lobby_id, 'owner.id': user_id },
        { $set: { type: 0 } },
        (error, result) => {
            // if error
            if (error) return callback({ code: 1001 }, null);
            else return callback(null, { success: result.nModified > 0 });
        });
}

module.exports = {
    get_lobbies: get_lobbies,
    create_lobby: create_lobby,
    get_lobby: get_lobby,
    make_deactive_lobby: make_deactive_lobby
}
