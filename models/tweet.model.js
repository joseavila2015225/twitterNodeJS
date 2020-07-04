'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tweetSchema = Schema({
    text: String
});

module.exports = mongoose.model('tweet', tweetSchema);