const mongoose = require("mongoose");

const Channel = new mongoose.Schema({
  name: { type: String, required: true },
  live: { type: Boolean, required: true },
  user_id: { type: Number, required: false },
  profile_image_url: { type: String, required: false },
});

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
  },
  password: {
    type: String,
    required: true,
  },
  channels: { type: [Channel], required: false },
  notificationsEnabled: { type: Boolean, default: null },
  webpushSubscription: { type: WebpushSubscription, default: null },
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
