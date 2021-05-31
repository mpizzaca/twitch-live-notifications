const router = require("express").Router();
const { Users } = require("../models");
const TwitchAPIManager = require("../TwitchAPIManager");

router.get("/channels", (req, res) => {
  const { userID } = res.locals.token;

  // If 'name' query param is present -> we're searching all Twitch channels
  if (req.query.name) {
    TwitchAPIManager.search(req.query.name)
      .then((result) =>
        result.map((channel) => ({
          id: channel.id,
          name: channel.display_name,
          live: channel.is_live,
          avatarURL: channel.thumbnail_url,
        }))
      )
      .then((result) => {
        res.send(result);
      })
      .catch((err) => console.log(err));
  } else {
    // Return all channels the user is getting notifications for
    Users.findOne({ _id: userID })
      .then((result) => res.send(result.channels))
      .catch((err) => res.status(500).send(err));
  }
});

// Subscribe to a channel
router.post("/channels", (req, res) => {
  const { userID } = res.locals.token;
  const { channel } = req.body;

  if (!channel) {
    return res.status(400).send({ message: "channel is required" });
  }

  Users.findOne({ _id: userID })
    .then((user) => {
      // Check that channel isn't in user's channels array
      if (
        user.channels.filter(
          (existingChannel) => existingChannel.name === channel.name
        ).length > 0
      ) {
        return Promise.reject({
          status: 400,
          message: `User is already subscribed to notifications for channel ${channel.name}`,
        });
      }
    })
    .then(() =>
      // Add the channel to the user's channels array
      Users.findOneAndUpdate(
        { _id: userID },
        { $push: { channels: { ...channel } } }
      )
    )
    .then(() => Users.findOne({ _id: userID }))
    .then((user) => res.send(user.channels))
    .catch((err) => {
      if (err.message && err.status) {
        res.status(err.status).send({ message: err.message });
      } else {
        res.status(500).send(err);
      }
    });
});

// Unsubscribe from a channel
router.delete("/channels/:channelName", (req, res) => {
  const { userID } = res.locals.token;
  const { channelName } = req.params;

  if (!channelName) {
    return res.status(400).send({ message: "channel is required" });
  }

  Users.findOneAndUpdate(
    { _id: userID },
    { $pull: { channels: { name: channelName } } }
  )
    .then(() => Users.findOne({ _id: userID }))
    .then((user) => res.send(user.channels))
    .catch((err) => res.status(500).send(err));
});

module.exports = router;
