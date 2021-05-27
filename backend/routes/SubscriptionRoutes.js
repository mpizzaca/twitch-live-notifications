const router = require("express").Router();
const { Users } = require("../models");

// Save the user's PushSubscription
router.post("/subscription", (req, res) => {
  const { userID } = res.locals.token;
  const { webpushSubscription } = req.body;

  if (!webpushSubscription) {
    return res.status(400).send("webpushSubscription is required");
  }

  Users.findOneAndUpdate({ _id: userID }, { webpushSubscription })
    .then(() => {
      res.send();
    })
    .catch((err) => res.status(500).send(err));
});

module.exports = router;
