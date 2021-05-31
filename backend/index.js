// setup dotenv
require("dotenv").config();

// npm modules
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const morgan = require("morgan");

// import local modules
const TwitchAPIManager = require("./TwitchAPIManager");

// import middleware
const { isAuthenticated } = require("./middleware");

// import routes
const UserRoutes = require("./routes/UserRoutes");
const ChannelRoutes = require("./routes/ChannelRoutes");
const SubscriptionRoutes = require("./routes/SubscriptionRoutes");
const StreamRoutes = require("./routes/StreamRoutes");

// configure mongoose
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useNewUrlParser", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);

// create the server
const app = express();
app.use(cors());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// add & configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// configure routes
app.use(UserRoutes);
app.use(StreamRoutes);
app.use(isAuthenticated, ChannelRoutes);
app.use(isAuthenticated, SubscriptionRoutes);

// start the server
app.listen(process.env.PORT || 3005, () =>
  console.log(`Server is running on port ${process.env.PORT || 3005}`)
);

// setup recurring webhook subscriptions (wait 10s before first, then run every time webhook expires)
setTimeout(() => {
  TwitchAPIManager.subscribeToStreamUpdates();
  setInterval(() => {
    TwitchAPIManager.subscribeToStreamUpdates();
  }, TwitchAPIManager.TWITCH_API_LEASE_SECONDS * 1000);
}, 10000);

// setup recurring avatarURL update for channels
setInterval(() => {
  TwitchAPIManager.updateChannelAvatars();
}, TwitchAPIManager.AVATAR_URL_UPDATE_FREQUENCY_MS);

module.exports = { app };
