const passport = require('passport');
const express = require('express');
const router = express.Router();
const AuthenticationService = require('../services/authentication-service');

const Lobby = require('../models/lobby-model');

const LobbyRepository = require('../repositories/lobby-repository');
const GameRepository = require('../repositories/game-repository');
const UserRepository = require('../repositories/user-repository');

router.path = '/lobby'

// get lobbies of a game
router.post('/get_lobbies', passport.authenticate('jwt', { session: false }), (req, res) => {
    // check permission for this path
    AuthenticationService.access_control(req, res, { router_path: router.path }, () => {

        // game id from body
        let game_id = req.body.game_id;

        LobbyRepository.get_lobbies(game_id, (error, result) => {
            if (error) return res.json({ success: false, error: error });
            else return res.json(result);
        });
    });
});

// get lobby by lobby id
router.post('/get_lobby', passport.authenticate('jwt', { session: false }), (req, res) => {
    // check permission for this path
    AuthenticationService.access_control(req, res, { router_path: router.path }, () => {

        // lobby id from body
        let lobby_id = req.body.lobby_id;

        LobbyRepository.get_lobby(lobby_id, (error, result) => {
            if (error) return res.json({ success: false, error: error });
            else return res.json(result);
        });
    });
});

// create a lobby
router.post('/create_lobby', passport.authenticate('jwt', { session: false }), (req, res) => {
    // check permission for this path
    AuthenticationService.access_control(req, res, { router_path: router.path }, () => {

        // game id from body
        let game_id = req.body.game_id;

        // member limit from body
        let member_limit = req.body.member_limit;

        // rank name from body
        let rank_name = req.body.rank_name;

        if (game_id && member_limit && rank_name) {

            // if user is not in lobby
            UserRepository.is_lobby_exist_on_user(req.user.id, (error_user, result) => {

                if (error_user) return res.json({ success: false, error: error_user });

                else if (result.success) {
                    return res.json({ success: false, error: { code: 2012 } });
                }
                else {
                    // user info from token key
                    let owner = {
                        id: req.user.id,
                        username: req.user.username,
                        avatar: req.user.avatar
                    };

                    // get game
                    GameRepository.get_game(game_id, (error_game, result_game) => {

                        if (error_game) return res.json({ success: false, error: error_game });
                        // game exists
                        else if (result_game.success) {

                            let game = {
                                id: result_game.game._id,
                                name: result_game.game.name,
                                short_name: result_game.game.short_name,
                                avatar: result_game.game.avatar,
                                ranks: [...result_game.game.ranks]
                            };

                            if (rank_name) {

                                // get rank from game variable
                                let rank = game.ranks.find(o => o.name == rank_name);
                                if (rank) {
                                    game['rank.name'] = rank.name;
                                    game['rank.avatar'] = rank.avatar;
                                }
                            }

                            // delete ranks from game
                            delete game.ranks;

                            let lobby = new Lobby({
                                owner,
                                member_limit,
                                game
                            });

                            // create lobby
                            LobbyRepository.create_lobby(lobby, (error_lobby, result_lobby) => {
                                if (error_lobby) return res.json({ success: false, error: error_lobby });
                                else return res.json(result_lobby);
                            });
                        }
                    });
                }
            });
        }
        else {
            return res.json({ success: false, error: { code: 2006 } });
        }
    });
});

// join lobby
router.post('/join_lobby', passport.authenticate('jwt', { session: false }), (req, res) => {
    // check permission for this path
    AuthenticationService.access_control(req, res, { router_path: router.path }, () => {

        // lobby id from body
        let lobby_id = req.body.lobby_id;

        let user = {
            id: req.user.id,
            username: req.user.username,
            avatar: req.user.avatar
        };

        // check if user already in a lobby
        UserRepository.is_lobby_exist_on_user(req.user.id, (error_user, result_is_lobby_exist) => {
            if (error_user) return res.json({ success: false, error: error_user });
            // user is already in a lobby
            else if (result_is_lobby_exist.success) {
                return res.json({ success: false, error: { code: 2012 } });
            }
            // user is not in a lobby
            else {

                LobbyRepository.get_lobby(lobby_id, (error_lobby, result_lobby) => {
                    if (error_lobby) return res.json({ success: false, error: error_lobby });
                    else {
                        // check if user is lobby owner
                        if (result_lobby.lobby.owner.id == req.user.id) {
                            return res.json({ success: false, error: { code: 2014 } });
                        }
                        // if user is not lobby owner
                        else {
                            LobbyRepository.push_member_to_lobby(lobby_id, user, (error_push_member, result_push_member) => {
                                if (error_push_member) return res.json({ success: false, error: error_push_member });
                                else {
                                    UserRepository.join_lobby(req.user.id, lobby_id, (error, result) => {
                                        if (error) return res.json({ success: false, error: error });
                                        else return res.json(result);
                                    });
                                }
                            });
                        }
                    }
                });
            }
        });


    });
});

// exit lobby
router.post('/exit_lobby', passport.authenticate('jwt', { session: false }), (req, res) => {
    // check permission for this path
    AuthenticationService.access_control(req, res, { router_path: router.path }, () => {

        UserRepository.get_profile(req.user.id, (error_user, result_user) => {
            if (error_user) return res.json({ success: false, error: error_user });
            // if lobby_id exist on user
            else if (result_user.user.lobby_id) {

                // if user is owner of lobby, turn lobby off
                LobbyRepository.exit_from_lobby(result_user.user.lobby_id, req.user.id,
                    (error_lobby_deactive, result_lobby_deactive) => {
                        if (error_lobby_deactive) return res.json({ success: false, error: error_lobby_deactive });
                        else {
                            // exit from lobby on user
                            UserRepository.exit_lobby(req.user.id, (error_user_lobby, result_user_lobby) => {
                                if (error_user_lobby) return res.json({ success: false, error: error_user_lobby });
                                else return res.json({ success: result_user_lobby.success });
                            });
                        }
                    });
            }
            // if lobby_id not exist on user
            else {
                return res.json({ success: false, error: { code: 2013 } });
            }
        });
    });
});

module.exports = router;
