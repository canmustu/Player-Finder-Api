const passport = require('passport');
const express = require('express');
const router = express.Router();
const AuthenticationService = require('../services/authentication-service');

const Game = require('../models/game-model');
const GameRepository = require('../repositories/game-repository');

router.path = '/game'

// get all games
router.post('/get_games', passport.authenticate('jwt', { session: false }), (req, res) => {
    GameRepository.get_games((error, result) => {
        if (error) return res.json({ success: false, error: error });
        else return res.json(result);
    });
});

module.exports = router;
