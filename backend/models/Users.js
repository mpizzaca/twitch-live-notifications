const mongoose = require("mongoose");

const Channel = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    live: { type: Boolean, required: true },
    avatarURL: { type: String, required: true },
  },
  { _id: false }
);

const Keys = new mongoose.Schema(
  {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  { _id: false }
);

const WebpushSubscription = new mongoose.Schema(
  {
    endpoint: { type: String, required: true },
    expirationTime: { type: Date, required: false },
    keys: { type: Keys, required: true },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    index: {
      unique: true,
      collation: { locale: "en", strength: 2 },
    },
  },
  password: {
    type: String,
    required: true,
  },
  channels: { type: [Channel], required: false },
  webpushSubscription: { type: WebpushSubscription, default: null },
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
