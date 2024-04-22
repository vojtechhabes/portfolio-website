const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.render("index");
});

router.get("/about", (req, res) => {
  res.render("about");
});

router.get("/projects", (req, res) => {
  res.render("projects");
});

router.get("/projects/:id", (req, res) => {
  res.render("project");
});

module.exports = router;
