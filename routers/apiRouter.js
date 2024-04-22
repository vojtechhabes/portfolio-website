const express = require("express");
const router = express.Router();

router.post("/auth/login", (req, res) => {
  res.status(400).json({ message: "Invalid email or password." });
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
