'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var key = 'twitter_secret_key_tengo_miedo';

exports.ensureAuth = (req, res, next) => {
    let params = req.body;
    let arrUserData = Object.values(params);
    let resp = arrUserData.toString().split(" ");
    if (!req.headers.authorization) {
        if (resp[0] === 'register') {
            next();
        } else if (resp[0] === 'login') {
            next();
        } else {
            return res.status(500).send({ message: 'Necesitas estar logueado para acceder a ' + resp[0] });
        }
    } else {
        const token = req.headers.authorization.replace(/["']+/g, '');
        try {
            var payLoad = jwt.decode(token, key, true);
            let idUser = payLoad.sub;
            let username = payLoad.username;
            module.exports.idUser = idUser;
            module.exports.username = username;
            if (payLoad.exp <= moment().unix()) {
                return res.status(401).send({ message: 'Token expirado.' });
            }
        } catch (ex) {
            return res.status(404).send({ message: 'Token no válido.' });
        }
        req.user = payLoad;
        next();
    }
}