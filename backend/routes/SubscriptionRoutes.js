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
    .catch((err) =>
      res.status(500).send({ message: `Error saving PushSubscription: ${err}` })
    );
});

// Delete a user's PushSubscription
router.delete("/subscription", (req, res) => {
  const { userID } = res.locals.token;

  Users.findOneAndUpdate({ _id: userID }, { webpushSubscription: null })
    .then(() => res.send())
    .catch((err) =>
      res
        .status(500)
        .send({ message: `Error deleting PushSubscription: ${err}` })
    );
});

module.exports = router;
