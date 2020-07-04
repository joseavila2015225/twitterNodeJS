'use strict'

var User = require('../models/user.model');
var Tweet = require('../models/tweet.model');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var authenticated = require('../middlewares/authenticated');
const {
    findOneAndUpdate
} = require('../models/user.model');

function commands(req, res) {
    var user = new User();
    var tweet = new Tweet();
    var params = req.body;
    var userData = Object.values(params);
    var resp = userData.toString().split(" ");

    if (resp[0] == 'login') {
        if (resp[1] != null && resp[2] != null) {
            User.findOne({
                $or: [{
                    username: resp[1]
                }, {
                    email: resp[1]
                }, {
                    name: resp[1]
                }]
            }, (err, userFind) => {
                if (err) {
                    res.status(500).send({
                        message: 'Error en el server'
                    });
                } else if (userFind) {
                    bcrypt.compare(resp[2], userFind.password, (err, checkPass) => {
                        if (err) {
                            res.status(500).send({
                                message: 'Error en el server'
                            });
                        } else if (checkPass) {
                            if (resp[3] == 'true') {
                                res.send({
                                    token: jwt.createToken(userFind)
                                });
                            } else {
                                res.send({
                                    user: userFind
                                });
                            }
                        } else {
                            res.send({
                                message: 'Contraseña incorrecta, intenta de nuevo'
                            });
                        }
                    });
                } else {
                    res.send({
                        message: 'Usuario no encontrado'
                    });
                }
            });
        } else {
            res.send({
                message: 'Ingresa usuario y contraseña'
            });
        }
    }
    if (resp[0] == 'register') {
        if (resp[1] != null && resp[2] != null && resp[3] != null && resp[4] != null) {
            User.findOne({
                $or: [{
                    email: resp[2]
                }, {
                    username: resp[3]
                }]
            }, (err, userFind) => {
                if (err) {
                    res.status(500).send({
                        message: 'Error en el server'
                    });
                } else if (userFind) {
                    res.send({
                        message: 'Usuario o correo ya utilizado'
                    });
                } else {
                    user.name = resp[1];
                    user.username = resp[2];
                    user.email = resp[3];
                    user.password = resp[4];

                    bcrypt.hash(resp[4], null, null, (err, hashPass) => {
                        if (err) {
                            res.status(500).send({
                                message: 'Fallo al encriptar'
                            });
                        } else {
                            user.password = hashPass;

                            user.save((err, userSaved) => {
                                if (err) {
                                    res.status(500).send({
                                        message: 'Error en el server'
                                    });
                                } else if (userSaved) {
                                    res.send({
                                        user: userSaved
                                    })
                                } else {
                                    res.status(404).send({
                                        message: 'Error al guardar el usuario'
                                    });
                                }
                            });
                        }
                    });
                }
            });
        } else {
            res.send({
                message: 'Por favor ingresa todos los datos'
            })
        }
    }

    if (resp[0] == 'add_tweet') {
        if (resp[1] != null) {
            tweet.text = resp.join(' ');
            tweet.text = tweet.text.replace('add_tweet', '');
            tweet.text = tweet.text.replace(' ', '');
            if (tweet.text.length <= 280) {
                tweet.save((err, tweetSaved) => {
                    if (err) {
                        res.status(500).send({
                            message: 'Error en el server'
                        });
                    } else if (tweetSaved) {
                        res.send({
                            tweet: tweetSaved
                        });
                    } else {
                        res.status(404).send({
                            message: 'No se ha podido guardar el tweet'
                        });
                    }
                });
            } else {
                res.status(404).send({
                    message: 'El tweet supera el número de caracteres disponibles'
                })
            }
        } else {
            res.send({
                message: '¿Qué deseas compartir?'
            });
        }
    }

    if (resp[0] == 'edit_tweet') {
        if (resp[1] != null) {
            if (resp[2] != null) {
                tweet.text = resp.join(' ');
                tweet.text = tweet.text.replace('edit_tweet', '');
                tweet.text = tweet.text.replace(resp[1], '');
                tweet.text = tweet.text.replace('  ', '');
                if (tweet.text.length <= 280) {
                    var update = tweet.text;

                    Tweet.findByIdAndUpdate(resp[1], {
                        $set: {
                            text: update
                        }
                    }, {
                        new: true
                    }, (err, tweetUpdated) => {
                        if (err) {
                            res.status(500).send({
                                message: 'Error en el server'
                            });
                        } else if (tweetUpdated) {
                            res.send({
                                tweet: tweetUpdated
                            });
                        } else {
                            res.status(404).send({
                                message: 'Hubo un error al editar el tweet'
                            });
                        }
                    });
                } else {
                    res.send({
                        message: 'Edite su tweet'
                    });
                }
            } else {
                res.status(404).send({
                    message: 'Este tweet supera el número de caracteres disponibles'
                })
            }
        } else {
            res.send({
                message: 'Ingrese el ID del tweet.'
            });
        }
    }

    if (resp[0] == 'delete_tweet') {
        if (resp[1] != null) {
            User.findByIdAndUpdate(authenticated.idUser, {
                $pull: {
                    tweets: resp[1]
                }
            }, {
                new: true
            }, (err, deleted) => {
                if (err) {
                    res.status(500).send({
                        message: 'Error en el server'
                    });
                } else if (deleted) {
                    Tweet.findByIdAndRemove(resp[1], (err, tweetFind) => {
                        if (err) {
                            res.status(500).send({
                                message: 'Error en el server'
                            });
                        } else if (tweetFind) {
                            res.send({
                                user: "El siguiente tweet ha sido eliminado",
                                deleted
                            });
                        } else {
                            res.status(404).send({
                                message: 'No se ha encontrado el tweet.'
                            });
                        }
                    });
                } else {
                    res.status(404).send({
                        message: 'No se ha podido eliminar el tweet.'
                    });
                }
            });
        } else {
            res.send({
                message: 'Ingrese el id del tweet que desea eliminar.'
            });
        }
    }

    if (resp[0] == "view_tweets") {
        var username = resp[1];

        User.find({
            $or: [{
                username: {
                    $regex: "^" + resp[1],
                    $options: "i"
                }
            }],
        }, (err, userFind) => {
            if (err) {
                res.status(404).send({
                    message: "Error en el server :(",
                    err
                });
            } else if (userFind) {
                res.send({
                    tweets: "Perfiles creados:",
                    userFind
                });
            } else {
                res.send({
                    message: "Ingrese el nombre de usuario que desea ver"
                });
            }
        }).populate("tweets");
    }

    if (resp[0] == 'set_tweet') {
        if (resp[1] != null) {
            Tweet.findById(resp[1], (err, tweetFind) => {
                if (err) {
                    res.status(500).send({
                        message: 'Error en el server'
                    });
                } else if (tweetFind) {
                    User.findByIdAndUpdate(resp[2], {
                        $push: {
                            tweets: resp[1]
                        }
                    }, {
                        new: true
                    }, (err, userUpdated) => {
                        if (err) {
                            res.status(500).send({
                                message: 'Error en el server'
                            });
                        } else if (userUpdated) {
                            res.send({
                                user: userUpdated
                            });
                        } else {
                            res.status(500).send({
                                message: 'No se ha podido insertar el tweet'
                            });
                        }
                    });
                } else {
                    res.send({
                        message: 'Tweet no encontrado'
                    });
                }
            });
        } else {
            res.send({
                message: 'Ingresa el ID del tweet'
            });
        }
    }

    if (resp[0] == "follow") {
        var username = resp[1];
        if (resp.length == 2) {
            User.findOne({
                username: username
            }, (err, Found) => {
                if (err) {
                    res.status(500).send({
                        message: "Error en el server" + err
                    });
                } else if (Found) {
                    if (req.user.username != Found.username) {
                        User.findOne({
                            _id: req.user.sub,
                            followers: Found._id
                        }, (err, userFind) => {
                            if (err) {
                                res.status(500).send({
                                    message: "Error en el server" + err
                                });
                            } else if (userFind) {
                                res.status(200).send({
                                    message: "Ya estás siguiendo a este usuario!"
                                });
                            } else {
                                User.findByIdAndUpdate(req.user.sub, {
                                    $push: {
                                        followers: Found._id
                                    }
                                }, {
                                    new: true
                                }, (err, followedAdded) => {
                                    if (err) {
                                        res.status(500).send({
                                            message: "Error :(" + err
                                        });
                                    } else if (followedAdded) {
                                        User.findByIdAndUpdate(Found._id, {
                                            $push: {
                                                followed: req.user.sub
                                            }
                                        }, {
                                            new: true
                                        }, (err, succeeded) => {
                                            if (err) {
                                                res.status(404).send({
                                                    message: "Error :(" + err
                                                });
                                            } else if (succeeded) {
                                                res.send({
                                                    follow: Found.username
                                                });
                                            } else {
                                                res.status(500).send({
                                                    message: "No se pudo seguir a este usuario",
                                                });
                                            }
                                        });
                                    } else {
                                        res.status(500).send({
                                            message: "Error en el server",
                                        });
                                    }
                                });
                            }
                        });
                    } else {
                        res.status(200).send({
                            message: "El comando no entiende qué quieres hacer!"
                        });
                    }
                } else {
                    res.status(404).send({
                        message: "Error general al seguir"
                    });
                }
            });
        } else {
            res.send({
                message: "Por favor ingresa el nombre del usuario al que deseas seguir"
            });
        }
    }

    if (resp[0] == "unfollow") {
        var username = resp[1];

        if (resp.length == 2) {
            User.findOne({
                username: username
            }, (err, userFound) => {
                if (err) {
                    res.status(500).send({
                        message: "Error :(" + err
                    });
                } else if (userFound) {
                    if (req.user.username != userFound.username) {
                        User.findOne({
                            _id: req.user.sub,
                            followers: userFound._id
                        }, (err, userFind) => {
                            if (err) {
                                res.status(500).send({
                                    message: "Error :(" + err
                                });
                            } else if (userFind) {
                                User.findByIdAndUpdate(req.user.sub, {
                                    $pull: {
                                        followers: userFound._id
                                    }
                                }, {
                                    new: true
                                }, (err, unfollowedAdded) => {
                                    if (err) {
                                        res.status(500).send({
                                            message: "Error :(" + err
                                        });
                                    } else if (unfollowedAdded) {
                                        User.findByIdAndUpdate(userFound._id, {
                                            $pull: {
                                                followed: req.user.sub
                                            }
                                        }, {
                                            new: true
                                        }, (err, succeeded) => {
                                            if (err) {
                                                res.status(500).send({
                                                    message: "Error :(" + err
                                                });
                                            } else if (succeeded) {
                                                res.send({
                                                    unfollow: userFound.username
                                                });
                                            } else {
                                                res.status(500).send({
                                                    message: "Error en el server",
                                                });
                                            }
                                        });
                                    } else {
                                        res.status(500).send({
                                            message: "Error en el server",
                                        })
                                    }
                                });
                            } else {
                                res.status(200).send({
                                    message: "Debes seguir a este usuario primero para poder dejar de seguirlo",
                                });
                            }
                        });
                    } else {
                        res.status(200).send({
                            message: "El comando no entiende qué quieres realizar humano!"
                        });
                    }
                } else {
                    res.status(404).send({
                        message: "Error en el server"
                    });
                }
            });
        } else {
            res.send({
                message: "Por favor ingresa el nombre de la persona a la que deseas dejar de seguir"
            });
        }
    }
}

module.exports = {
    commands
}