const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { isAuthenticated } = require("../middleware");
const { Users } = require("../models");

router.get("/", isAuthenticated, (req, res) => res.send());

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .send({ message: "username and password are required" });
  }

  Users.findOne({ username })
    .then((user) => {
      if (!user) {
        return Promise.reject({ status: 400, message: "username not found" });
      }
      return Promise.all([
        Promise.resolve(user),
        bcrypt.compare(password, user.password),
      ]);
    })
    .then(([user, match]) => {
      if (!match) {
        return Promise.reject({ status: 401, message: "wrong password" });
      }
      const token = jwt.sign({ userID: user._id }, process.env.JWT_PRIVATE_KEY);
      res.send({
        username: user.username,
        token,
        webpushSubscription: user.webpushSubscription,
      });
    })
    .catch((err) => res.status(err.status).send({ message: err.message }));
});

router.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .send({ message: "username and password are required" });
  }
  if (password?.length < 6) {
    return res
      .status(400)
      .send({ message: "password must be at least 6 characters" });
  }
  // Generate hash
  bcrypt
    .hash(password, 10)
    .then((hashedPassword) => {
      // Save the new user
      const newUser = new Users({
        username,
        password: hashedPassword,
      });
      return newUser.save();
    })
    .then((user) => {
      // Sign the JWT and send token + username back
      const token = jwt.sign({ userID: user._id }, process.env.JWT_PRIVATE_KEY);
      res.status(201).send({ username: user.username, token });
    })
    .catch((err) => {
      console.error(err.code);
      if (err.code === 11000) {
        res.status(400).send({ message: "user already exists" });
      } else if (err.status && err.message) {
        res.status(err.status).send({ message: err.message });
      } else {
        res.status(500).send(err);
      }
    });
});

module.exports = router;
