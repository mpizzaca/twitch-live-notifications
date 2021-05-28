const router = require("express").Router();
const { Users } = require("../models");
const { sendNotification } = require("../NotificationManager");

// Endpoint Twitch API will use to confirm the webhook subscription
router.get("/streams/*", (req, res) => {
  if (req.query["hub.challenge"]) {
    // twitch API is confirming webhook - respond with challenge
    return res.send(req.query["hub.challenge"]);
  }
  if (req.query["hub.mode" === "denied"]) {
    console.log(
      "Error confirming webhook subscription: ",
      req.query["hub.reason"]
    );
    res.end();
  }
});

// Endpoint Twitch API will use to send stream updates
router.post("/streams/:channelName", (req, res) => {
  const isLive = req.body.data[0]?.type === "live";
  const { channelName } = req.params;

  console.log(`${channelName}'s stream just updated, live: ${isLive}`);

  Users.find({ channels: { $elemMatch: { name: channelName } } }).then(
    (users) => {
      for (user of users) {
        const channelIndex = user.channels.findIndex(
          (channel) => channel.name === channelName
        );
        const wasLive = user.channels[channelIndex].live;

        if (isLive && !wasLive) {
          // Channel went live
          // send notification
          if (user.webpushSubscription) {
            let payload = {
              notification: {
                title: channelName + " just went live!",
                icon: user.channels[channelIndex].avatarURL,
                actions: [{ action: "watch", title: "Watch now!" }],
                data: { url: "http://twitch.tv/" + channelName },
              },
            };
            payload = JSON.stringify(payload);
            console.log(
              `Dispatching push notification for ${channelName}'s stream`
            );
            sendNotification(user.webpushSubscription, payload);
          }
        }
      }
      // Update live status
      console.log(
        `Updating live status with channelName: '${channelName}', isLive: '${isLive}'`
      );
      return Users.updateMany(
        { channels: { $elemMatch: { name: channelName } } },
        { $set: { "channels.$[channel].live": isLive } },
        { arrayFilters: [{ "channel.name": { $eq: channelName } }] }
      );
    }
  );
  res.send();
});

module.exports = router;
