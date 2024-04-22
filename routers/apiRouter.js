const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");

router.post("/auth/login", async (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({
      code: "missing-credentials",
      message: "Both username and password are required.",
    });
  }

  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      const salt = await bcrypt.genSalt();
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = new User({
        username,
        passwordHash,
      });

      await newUser.save();

      return res.status(201).json({
        code: "user-created",
        message: "User created successfully.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({
        code: "incorrect-credentials",
        message: "The provided credentials are incorrect.",
      });
    }

    return res.status(200).json({
      code: "login-success",
      message: "User logged in successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: "server-error",
      message: "An error occurred while processing the request.",
    });
  }
});

router.post("/auth/refresh", (req, res) => {
  // new refresh and access token
});

router.post("/auth/logout", (req, res) => {
  // log user out
});

router.patch("/auth/password", (req, res) => {
  // change user password
});

router.post("/projects/:id", (req, res) => {
  // add project to database
});

module.exports = router;
