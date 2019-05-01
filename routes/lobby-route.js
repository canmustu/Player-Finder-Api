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

        // game id from body
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

module.exports = router;
