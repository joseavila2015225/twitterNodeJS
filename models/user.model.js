'user strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = Schema({
    name: String,
    username: String,
    email: String,
    password: String,
    tweets: [{
        type: Schema.Types.ObjectId,
        ref: 'tweet'
    }],
    followers: [{
        type: Schema.Types.ObjectId,
        ref: 'user'
    }],
    numfollowers: Number
});

module.exports = mongoose.model('user', userSchema);