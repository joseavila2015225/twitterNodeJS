'use strict'

var express = require('express');
var userController = require('../controllers/user.controller');
var api = express();
var auth = require('../middlewares/authenticated');

api.post('', auth.ensureAuth, userController.commands)

module.exports = api;