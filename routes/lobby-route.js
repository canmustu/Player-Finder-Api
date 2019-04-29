const passport = require('passport');
const express = require('express');
const router = express.Router();
const AuthenticationService = require('../services/authentication-service');

const Lobby = require('../models/lobby-model');
const LobbyRepository = require('../repositories/lobby-repository');

router.path = '/lobby'

// get all games
router.post('/get_lobbies', passport.authenticate('jwt', { session: false }), (req, res) => {
    // check permission for this path
    AuthenticationService.access_control(req, res, { router_path: router.path }, () => {
        
        // target game id from body
        let game_id = req.body.game_id;

        LobbyRepository.get_lobbies(game_id, (error, result) => {
            if (error) return res.json({ success: false, error: error });
            else return res.json(result);
        });
    });
});

module.exports = router;
