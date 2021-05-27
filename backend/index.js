// setup dotenv
require("dotenv").config();

// npm modules
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const path = require("path");
const morgan = require("morgan");

// local modules
const TwitchAPIManager = require("./TwitchAPIManager");
const { sendNotification } = require("./NotificationManager");
const { Users } = require("./models");

// middleware imports
const { isAuthenticated } = require("./middleware");

// route imports
const UserRoutes = require("./routes/UserRoutes");
const ChannelRoutes = require("./routes/ChannelRoutes");

const TWITCH_API_LEASE_SECONDS =
  process.env.NODE_ENV === "production" ? 300 : 30;

// configure mongoose
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// create the server
const app = express();
app.use(cors());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// setup recurring webhook subscriptions (wait 10s before first, then run every time webhook expires)
setTimeout(() => {
  TwitchAPIManager.subscribeToChannelUpdates();
  setInterval(() => {
    TwitchAPIManager.subscribeToChannelUpdates();
  }, TWITCH_API_LEASE_SECONDS * 1000);
}, 10000);

// add & configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// configure routes
app.use(UserRoutes);
app.use(isAuthenticated, ChannelRoutes);

//*******************//
//     ENDPOINTS     //
//*******************//

app.get("/subscribe", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.sendStatus(401);
  } else {
    UserData.findOne({ username: req.user.username }, (err, doc) => {
      if (err) {
        return res.sendStatus(400);
      }
      if (doc) {
        console.log(doc.webpushSubscription);
        return res.send(doc.webpushSubscription);
      }
    });
  }
});

// Users enabled notifications.
// Request will contain WebPush subscription necessary to send the notification.
app.post("/subscribe", (req, res) => {
  if (req.isAuthenticated()) {
    console.log(JSON.stringify(req.body));

    const filter = { username: req.user.username };
    const update = {
      webpushSubscription: req.body.subscription,
      notificationsEnabled: req.body.notifications,
    };

    UserData.findOneAndUpdate(
      filter,
      update,
      { new: true, useFindAndModify: false },
      (err, doc) => {
        if (doc && !err) {
          // updated UserData object
          //return res.send(doc)
          console.log("doc: " + JSON.stringify(doc));
          return res.sendStatus(200);
        } else if (err) {
          return res.status(400).send(err);
        }
      }
    );
  } else {
    res.status(401).send();
  }
});

// send a test notification
app.post("/notify", (req, res) => {
  if (req.isAuthenticated()) {
    // find user's webpushSubscription & send notification
    UserData.findOne(
      { username: req.user.username },
      "webpushSubscription",
      (err, doc) => {
        if (err) {
          res.status(400).send(err);
        }
        var payload = JSON.stringify({
          title: "Congratulations!",
          body: "Notifications are enabled!",
        });
        sendNotification(doc.webpushSubscription, payload);
        return res.redirect("/");
      }
    );
  } else {
    res.status(401).send();
  }
});

app.get("/test", (req, res) => {
  TwitchAPIManager.subscribeToChannelUpdates();
  return res.redirect("/");
});

app.get("/streams/*", (req, res) => {
  if (req.query["hub.challenge"]) {
    // twitch API is confirming webhook - respond with challenge
    console.log("Webhook subscription confirmed for: " + req.params["0"]);
    return res.send(req.query["hub.challenge"]);
  }
});

app.post("/streams/*", (req, res) => {
  let live = req.body.data[0]?.type === "live";
  let channelName = req.params["0"];
  console.log("live: " + live);

  Channel.findOne({ name: channelName }, (err, doc) => {
    if (err) {
      console.log("Error finding channel: " + err);
      return res.send();
    } else {
      // debug: console.log('doc: ' + doc)
      if (live && !doc.live) {
        // channel just went live - send notification
        console.log(channelName + " just went live, sending notifications");

        let payload = {
          title: channelName + " just went live!",
          icon: doc.profile_image_url,
          actions: [{ action: "watch", title: "Watch now!" }],
          data: { url: "http://twitch.tv/" + channelName },
        };
        payload = JSON.stringify(payload);

        UserData.find({ channels: channelName }, (err, res) => {
          if (err) {
            return console.log(
              "Error pulling UserData to send notifications: " + err
            );
          }
          res.forEach((doc) => {
            sendNotification(doc.webpushSubscription, payload);
          });
        });
      } else if (!live && doc.live) {
        console.log(channelName + " just went offline");
      }
      // update 'channels' live status
      Channel.findOneAndUpdate(
        { name: channelName },
        { live: live },
        { useFindAndModify: false }
      ).exec();
      return res.send();
    }
  });
});

// start the server
app.listen(process.env.PORT || 3005, () =>
  console.log(`Server is running on port ${process.env.PORT || 3005}`)
);

module.exports = { app };
