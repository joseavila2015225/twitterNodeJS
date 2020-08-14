"user strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

const userSchema = Schema({
  name: String,
  email: String,
  username: String,
  password: String,
  tweets: [{ type: Schema.Types.ObjectId, ref: "tweet" }],
  followers: [{ type: String }],
  numFollowers: Number,
});

module.exports = mongoose.model("user", userSchema);
