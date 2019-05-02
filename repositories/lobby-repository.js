const mongoose = require('mongoose');
const crypto = require('crypto');
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');
const keys = require('../config/keys');
const jwt = require('jsonwebtoken');

const Lobby = require('../models/lobby-model');
const User = require('../models/user-model');

get_lobbies = function (game_id, callback) {
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

exit_from_lobby = function (lobby_id, user_id, callback) {
    Lobby.findById(lobby_id, (error_lobby, result_lobby) => {
        if (error_lobby) return callback({ code: 1001 }, null);
        else {
            if (result_lobby.owner.id == user_id) {
                Lobby.updateOne(
                    { _id: lobby_id, 'owner.id': user_id },
                    { $set: { type: 0 } },
                    (error, result) => {
                        if (error) return callback({ code: 1001 }, null);
                        else return callback(null, { success: result.nModified ? true : false });
                    });
            }
            else {
                // pull
                Lobby.updateOne(
                    { _id: lobby_id },
                    {
                        $pull: {
                            members: {
                                user: {
                                    id: user_id
                                }
                            }
                        }
                    },
                    (error, result) => {
                        if (error) return callback({ code: 1001 }, null);
                        else return callback(null, { success: result.nModified ? true : false });
                    });
            }
        }
    });
}

push_member_to_lobby = function (lobby_id, user, callback) {

    Lobby.findById(lobby_id, (error_lobby, result_lobby) => {

        if (error_lobby) return callback({ code: 1001 }, null);
        // check if there is a place for a new member at lobby
        else if (result_lobby.members.length + 1 < result_lobby.member_limit) {
            // add member to lobby
            Lobby.updateOne(
                { _id: lobby_id },
                {
                    $push: {
                        members: {
                            user: user
                        }
                    }
                },
                (error_update_lobby, result_update_lobby) => {
                    if (error_update_lobby) return callback({ code: 1001 }, null);
                    else return callback(null, { success: result_update_lobby.nModified ? true : false });
                });
        }
        else return callback({ code: 5001 }, null);
    });


}

module.exports = {
    get_lobbies: get_lobbies,
    create_lobby: create_lobby,
    get_lobby: get_lobby,
    exit_from_lobby: exit_from_lobby,
    push_member_to_lobby: push_member_to_lobby
}
