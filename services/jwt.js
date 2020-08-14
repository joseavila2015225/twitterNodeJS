'use strict'

const jwt = require('jwt-simple');
const moment = require('moment');
const key = 'user1808Pass123';

exports.createToken = (user)=>{
    let payload = {
        sub: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        iat: moment().unix(),
        exp: moment().add(10, "days").unix()
    };
    return jwt.encode(payload, key);
}