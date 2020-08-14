"use strict";

const User = require("../models/user.model");
const Tweet = require("../models/tweet.model");
const bcrypt = require("bcrypt-nodejs");
const jwt = require("../services/jwt");
const authenticated = require("../middlewares/authenticated");

function commands(req, res) {
  let user = new User();
  let tweet = new Tweet();
  let params = req.body;
  let arrUserData = Object.values(params);
  let datos = arrUserData.toString().split(" ");

  switch (datos[0]) {
    case "register":
      if (
        datos[1] != null &&
        datos[2] != null &&
        datos[3] != null &&
        datos[4] != null
      ) {
        User.findOne(
          { $or: [{ email: datos[2] }, { username: datos[3] }] },
          (err, userFind) => {
            if (err) {
              res.status(500).send({ message: "Error en el server" });
            } else if (userFind) {
              res.send({ message: "Usuario o correo en uso" });
            } else {
              user.name = datos[1];
              user.email = datos[2];
              user.username = datos[3];
              user.password = datos[4];

              bcrypt.hash(datos[4], null, null, (err, hashPass) => {
                if (err) {
                  res.status(500).send({ message: "Fallo al encriptar" });
                } else {
                  user.password = hashPass;

                  user.save((err, userSaved) => {
                    if (err) {
                      res
                        .status(500)
                        .send({ message: "Error en el server" });
                    } else if (userSaved) {
                      res.send({ user: userSaved });
                    } else {
                      res
                        .status(404)
                        .send({ message: "Error al registrarse en Twitter" });
                    }
                  });
                }
              });
            }
          }
        );
      } else {
        res.status(404).send({ message: "Por favor ingresa todos los datos requeridos" });
      }
      break;

    case "login":
      if (datos[1] != null && datos[2] != null) {
        User.findOne(
          { $or: [{ username: datos[1] }, { email: datos[1] }] },
          (err, userFind) => {
            if (err) {
              res.status(500).send({ message: "Error en el server" });
            } else if (userFind) {
              bcrypt.compare(datos[2], userFind.password, (err, checkPass) => {
                if (err) {
                  res.status(500).send({ message: "Error en el server" });
                } else if (checkPass) {
                  if (datos[3] == "true") {
                    res.send({ token: jwt.createToken(userFind) });
                  } else {
                    res.send({ user: userFind });
                  }
                } else {
                  res.status(404).send({ message: "Buen intento, ahora ingresa la contraseña correcta" });
                }
              });
            } else {
              res.status(404).send({ message: "Usuario no existente" });
            }
          }
        );
      } else {
        res.status(404).send({ message: "Por favor ingresa tu usuario y tu contraseña" });
      }
      break;

    case "add_tweet":
      if (datos[1] != null) {
        tweet.content = datos.join(" ");
        tweet.content = tweet.content.replace("add_tweet", "");
        tweet.content = tweet.content.replace(" ", "");
        tweet.user = authenticated.username;
        
        if (tweet.content.length <= 280) {
          User.findByIdAndUpdate(
            authenticated.idUser,
            { $inc: { numTweets: 1 } },
            { new: true },
            (err, userUpdate) => {
              if (err) {
                res.status(500).send({ message: "Error en el server" });
              } else if (userUpdate) {
                tweet.save((err, tweetSaved) => {
                  if (err) {
                    res.status(500).send({ message: "Error en el server" });
                  } else if (tweetSaved) {
                    res.send({ tweet: tweetSaved });
                  } else {
                    res
                      .status(404)
                      .send({ message: "No has podido tweetear" });
                  }
                });
              } else {
                res
                  .status(404)
                  .send({ message: "No se ha podido agregar el tweet" });
              }
            }
          );
        } else {
          res
            .status(404)
            .send({
              message: "El tweet puede tener un máximo de 280 caracteres!",
            });
        }
      } else {
        res.status(404).send({ message: "Ingresa lo que deseas compartir!" });
      }
      break;

    case "edit_tweet":
      if (datos[1] != null) {
        if (datos[2] != null) {
          let content = tweet.content;
          content = datos.join(" ");
          content = content.replace("edit_tweet", "");
          content = content.replace(datos[1], "");
          content = content.replace("  ", "");

          if (content.length <= 280) {
            let update = content;
            Tweet.findByIdAndUpdate(
              datos[1],
              { $set: { content: update } },
              { new: true },
              (err, tweetUpdated) => {
                if (err) {
                  res.status(500).send({ message: "Error en el server" });
                } else if (tweetUpdated) {
                  res.send({ tweet: tweetUpdated, content });
                } else {
                  res
                    .status(404)
                    .send({ message: "Hubo un error al editar tu tweet" });
                }
              }
            );
          } else {
            res
              .status(404)
              .send({
                message:
                  "El tweet puede tener un máximo de 280 caracteres",
              });
          }
        } else {
          res
            .status(404)
            .send({ message: "Edite su tweet" });
        }
      } else {
        res.status(404).send({ message: "Por favor ingresa el ID del tweet que deseas editar" });
      }
      break;

    case "delete_tweet":
      if (datos[1] != null) {
        Tweet.findByIdAndRemove(datos[1], (err, tweetFind) => {
          if (err) {
            res.status(500).send({ message: "Error en el server" });
          } else if (tweetFind) {
            User.findByIdAndUpdate(
              authenticated.idUser,
              { $inc: { numTweets: -1 } },
              { new: true },
              (err, numTweets) => {
                if (err) {
                  res.status(500).send({ message: "Error en el server" });
                } else if (numTweets) {
                  res.send({ message: "El Tweet ha sido eliminado", tweetFind });
                } else {
                  res
                    .status(404)
                    .send({
                      message:
                        "Hubo un error al borrar el Tweet",
                    });
                }
              }
            );
          } else {
            res.status(404).send({ message: "Este Tweet no existe" });
          }
        });
      } else {
        res
          .status(404)
          .send({ message: "Por favor ingresa el ID del tweet que deseas eliminar" });
      }
      break;

    case "view_tweets":
      if (datos[1] != null) {
        Tweet.findOne(
          { user: { $regex: datos[1], $options: "i" } },
          (err, tweetsFind) => {
            if (err) {
              res.status(500).send({ message: "Error en el server" });
            } else if (tweetsFind) {
              Tweet.find(
                { user: { $regex: datos[1], $options: "i" } },
                (err, tweets) => {
                  if (err) {
                    res.status(500).send({ message: "Error en el server" });
                  } else if (tweets) {
                    res.send({ tweets: tweets });
                  } else {
                    res
                      .status(404)
                      .send({ message: "No se han podido mostrar los tweets!" });
                  }
                }
              ).populate("retweet");
            } else {
              res.status(404).send({ message: "Este usuario aún no ha tweeteado" });
            }
          }
        );
      } else {
        res
          .status(404)
          .send({
            message: "Ingresa el nombre del usuario del que deseas ver los Tweets",
          });
      }
      break;

    case "follow":
      if (datos[1] != null) {
        if (authenticated.username === datos[1]) {
          res.status(404).send({ message: "No te puedes seguir a ti mismo, eso no tiene sentido!" });
        } else {
          User.findOne(
            { username: datos[1], followers: authenticated.username },
            (err, followerFind) => {
              if (err) {
                res.status(500).send({ message: "Error en el server" });
              } else if (followerFind) {
                res.send({ message: "Ya sigues a este usuario" });
              } else {
                User.findOneAndUpdate(
                  { username: datos[1] },
                  { $push: { followers: authenticated.username } },
                  { new: true },
                  (err, followed) => {
                    if (err) {
                      res.status(500).send({ message: "Error en el server" });
                    } else if (followed) {
                      User.findOneAndUpdate(
                        { username: datos[1] },
                        { $inc: { noFollowers: 1 } },
                        { new: true },
                        (err, noFollowers) => {
                          if (err) {
                            res
                              .status(500)
                              .send({ message: "Error en el server" });
                          } else if (noFollowers) {
                            res.send({ message: "Ahora estas siguiendo a: " + datos[1] });
                          } else {
                            res
                              .status(404)
                              .send({
                                message:
                                  "Ha ocurrido un error al realizar esta acción",
                              });
                          }
                        }
                      );
                    } else {
                      res
                        .status(404)
                        .send({ message: "Hubo un error al intentar seguir a: " + datos[1] });
                    }
                  }
                );
              }
            }
          );
        }
      } else {
        res
          .status(404)
          .send({ message: "Por favor ingresa el nombre del usuario al que deseas seguir" });
      }
      break;

    case "unfollow":
      if (datos[1] != null) {
        User.findOne(
          { username: datos[1], followers: authenticated.username },
          (err, followerFind) => {
            if (err) {
              res.status(500).send({ message: "Error en el server" });
            } else if (followerFind) {
              User.findOneAndUpdate(
                { username: datos[1] },
                { $pull: { followers: authenticated.username } },
                { new: true },
                (err, followed) => {
                  if (err) {
                    res.status(500).send({ message: "Error en el server" });
                  } else if (followed) {
                    User.findOneAndUpdate(
                      { username: datos[1] },
                      { $inc: { noFollowers: -1 } },
                      { new: true },
                      (err, noFollowers) => {
                        if (err) {
                          res
                            .status(500)
                            .send({ message: "Error en el server" });
                        } else if (noFollowers) {
                          res.send({
                            message: "Ya no sigues a este usuario: " + datos[1],
                          });
                        } else {
                          res
                            .status(404)
                            .send({
                              message:
                                "Hubo un error al dejar de seguir",
                            });
                        }
                      }
                    );
                  } else {
                    res
                      .status(404)
                      .send({
                        message: "Hubo un error al dejar de seguir a: " + datos[1],
                      });
                  }
                }
              );
            } else {
              res.status(404).send({ message: "No sigues a este usuario." });
            }
          }
        );
      } else {
        res
          .status(404)
          .send({ message: "Por favor ingresa el nombre del usuario al que deseas dejar de seguir" });
      }
      break;

    case "profile":
      if (datos[1] != null) {
        User.findOne(
          { username: { $regex: datos[1], $options: "i" } },
          (err, tweets) => {
            if (err) {
              res.status(500).send({ message: "Error en el server" });
            } else if (tweets) {
              User.find(
                { username: datos[1] },
                {
                  noFollowers: 1,
                  numTweets: 1,
                  _id: 0,
                  email: 1,
                  name: 1,
                  followers: 1,
                },
                (err, userFind) => {
                  if (err) {
                    res.status(500).send({ message: "Error en el server" });
                  } else if (userFind) {
                    res.send({ message: userFind });
                  } else {
                    res
                      .status(404)
                      .send({
                        message:
                          "Hubo un error al mostrar el perfil",
                      });
                  }
                }
              );
            } else {
              res
                .status(404)
                .send({ message: "No se ha encontrado a este usuario" });
            }
          }
        );
      } else {
        res.status(404).send({ message: "Por favor ingresa el nombre del usuario al que deseas ver" });
      }
      break;

    case "like":
      if (datos[1] != null) {
        Tweet.findById(datos[1], (err, findTweet) => {
          if (err) {
            res.status(500).send({ message: "Error en el server" });
          } else if (findTweet) {
            let user = findTweet.user;
            User.findOne(
              { username: { $regex: user, $options: "i" } },
              (err, userFind) => {
                if (err) {
                  res.status(500).send({ message: "Error en el server" });
                } else if (userFind) {
                  let idUser = userFind.id;
                  User.findOne(
                    { _id: idUser, followers: authenticated.username },
                    (err, follower) => {
                      if (err) {
                        res.status(500).send({ message: "Error en el server" });
                      } else if (follower) {
                        Tweet.findOne(
                          { _id: datos[1], likes: authenticated.username },
                          (err, likesFind) => {
                            if (err) {
                              res
                                .status(500)
                                .send({
                                  message: "Error al intentar darle like",
                                });
                            } else if (likesFind) {
                              res.send({
                                message: "Ya te gusta este tweet!",
                              });
                            } else {
                              Tweet.findByIdAndUpdate(
                                datos[1],
                                { $push: { likes: authenticated.username } },
                                { new: true },
                                (err, liked) => {
                                  if (err) {
                                    res.status(500).send({
                                      message: "Error en el server",
                                    });
                                  } else if (liked) {
                                    Tweet.findByIdAndUpdate(
                                      datos[1],
                                      { $inc: { numberLikes: 1 } },
                                      { new: true },
                                      (err, noLikes) => {
                                        if (err) {
                                          res.status(500).send({
                                            message: "Error en el server",
                                          });
                                        } else if (noLikes) {
                                          res.send({
                                            message:
                                              "Le has dado like a este tweet!",
                                          });
                                        } else {
                                          res.status(404).send({
                                            message:
                                              "No se puede volver a darle like!",
                                          });
                                        }
                                      }
                                    );
                                  } else {
                                    res.status(404).send({
                                      message:
                                        "Ha ocurrido un error al darle like a este Tweet!",
                                    });
                                  }
                                }
                              );
                            }
                          }
                        );
                      } else {
                        res.status(404).send({
                          message:
                            "Debes seguir a este user para poder darle like a sus tweets",
                        });
                      }
                    }
                  );
                } else {
                  res
                    .status(404)
                    .send({ message: "No se ha encontrado al usuario" });
                }
              }
            );
          } else {
            res
              .status(404)
              .send({ message: "No se ha encontrado ningún tweet" });
          }
        });
      } else {
        res.status(404).send({
          message: "Ingresa el id del tweet al que desees darle like",
        });
      }
      break;

    case "dislike":
      if (datos[1] != null) {
        Tweet.findOne(
          { _id: datos[1], likes: authenticated.username },
          (err, likesFind) => {
            if (err) {
              res.status(500).send({ message: "Error en el server" });
            } else if (likesFind) {
              Tweet.findByIdAndUpdate(
                datos[1],
                { $pull: { likes: authenticated.username } },
                { new: true },
                (err, liked) => {
                  if (err) {
                    res.status(500).send({ message: "Error en el server" });
                  } else if (liked) {
                    Tweet.findByIdAndUpdate(
                      datos[1],
                      { $inc: { numberLikes: -1 } },
                      { new: true },
                      (err, noLikes) => {
                        if (err) {
                          res
                            .status(500)
                            .send({ message: "Error en el server" });
                        } else if (noLikes) {
                          res.send({ message: "Ya no te gusta este tweet" });
                        } else {
                          res.status(404).send({
                            message: "Ya te ha dejado de gustar este tweet",
                          });
                        }
                      }
                    );
                  } else {
                    res.status(404).send({
                      message:
                        "Ha ocurrido un error al darle dislike a este Tweet",
                    });
                  }
                }
              );
            } else {
              res
                .status(404)
                .send({ message: "No le has dado like a este Tweet" });
            }
          }
        );
      } else {
        res.status(404).send({
          message: "Ingresa el ID del tweet al que desees darle like.",
        });
      }
      break;

    case "reply":
      if (datos[1] != null) {
        if (datos[2] != null) {
          Tweet.comments = datos.join(" ");
          Tweet.comments = Tweet.comments.replace("reply", "");
          Tweet.comments = Tweet.comments.replace(datos[1], "");
          Tweet.comments = Tweet.comments.replace("  ", "");
          let comment = Tweet.comments;

          if (Tweet.comments.length <= 280) {
            Tweet.findByIdAndUpdate(
              datos[1],
              { $inc: { numberComments: 1 } },
              { new: true },
              (err, tweetUpdate) => {
                if (err) {
                  res.status(500).send({ message: "Error en el server" });
                } else if (tweetUpdate) {
                  Tweet.findByIdAndUpdate(
                    datos[1],
                    {
                      $push: {
                        comments: { reply: comment, user: authenticated.username },
                      },
                    },
                    { new: true },
                    (err, tweetSaved) => {
                      if (err) {
                        res.status(500).send({ message: "Error en el server" });
                      } else if (tweetSaved) {
                        res.send({ tweet: tweetSaved });
                      } else {
                        res.status(404).send({
                          message: "No se has podido responder a este tweet",
                        });
                      }
                    }
                  );
                } else {
                  res.status(404).send({
                    message: "No se ha podido responder a este tweet",
                  });
                }
              }
            );
          } else {
            res.status(404).send({
              message:
                "Tu respuesta excede el número máximo de caracteres (280)!",
            });
          }
        } else {
          res.status(404).send({ message: "Comparte tu respuesta!" });
        }
      } else {
        res.status(404).send({
          message: "Ingrese el ID del tweet al que quieras responder",
        });
      }
      break;

    case "retweet":
      if (datos[1] != null) {
        tweet.content = datos.join(" ");
        tweet.content = tweet.content.replace("retweet", "");
        tweet.content = tweet.content.replace(datos[1], "");
        tweet.content = tweet.content.replace("  ", "");
        let content = tweet.content;

        tweet.save((err, tweetFind) => {
          if (err) {
            res.status(500).send({ message: "Error en el server" });
          } else if (tweetFind) {
            let idTweet = tweetFind.id;
            User.findByIdAndUpdate(
              authenticated.idUser,
              { $inc: { numTweets: 1 } },
              { new: true },
              (err, numTweets) => {
                if (err) {
                  res.status(500).send({ message: "Error en el server" });
                } else if (numTweets) {
                  Tweet.findByIdAndUpdate(
                    datos[1],
                    { $inc: { numberRetweets: 1 } },
                    { new: true },
                    (err, noRetweet) => {
                      if (err) {
                        res.status(500).send({ message: "Error en el server" });
                      } else if (noRetweet) {
                        Tweet.findByIdAndUpdate(
                          idTweet,
                          {
                            $set: {
                              content: content,
                              retweet: datos[1],
                              user: authenticated.username,
                            },
                          },
                          { new: true },
                          (err, retweet) => {
                            if (err) {
                              res
                                .status(500)
                                .send({ message: "Error en el server" });
                            } else if (retweet) {
                              res.send({ tweet: retweet });
                            } else {
                              res.send({
                                message: "No se ha podido retweetear",
                              });
                            }
                          }
                        ).populate("retweet");
                      } else {
                        res.status(404).send({
                          message: "Ya has retweeteado esto anteriormente",
                        });
                      }
                    }
                  );
                } else {
                  res.status(404).send({
                    message:
                      "Error, no se puede incrementar la cantidad de retweets",
                  });
                }
              }
            );
          } else {
            res
              .status(404)
              .send({ message: "Ha ocurrido un error al retweetear." });
          }
        });
      } else {
        res
          .status(404)
          .send({ message: "Ingresa el ID del tweet que deseas retweetear" });
      }
      break;

    default:
      res
        .status(404)
        .send({
          message: "Ingresa un comando válido para realizar una acción",
        });
      break;
  }
}

module.exports = {
  commands,
};