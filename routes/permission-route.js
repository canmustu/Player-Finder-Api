const mongoose = require('mongoose');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const keys = require('../config/keys');
const express = require('express');
const router = express.Router();

const Permission = require('../models/permission-model');

const PermissionRepository = require('../repositories/permission-repository');

router.path = '/permission'


module.exports = router;
