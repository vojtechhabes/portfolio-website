const express = require("express");
const router = express.Router();
const Project = require("../models/project");
const showdown = require("showdown");
const { authMiddleware } = require("../middlewares/authMiddleware");
const {
  validateAccessToken,
  validateRefreshToken,
  refreshBothTokens,
} = require("../utils/tokenManagement");

const converter = new showdown.Converter();

router.get("/", (req, res) => {
  res.render("index");
});

router.get("/about", (req, res) => {
  res.render("about");
});

router.get("/projects", async (req, res) => {
  try {
    const projects = await Project.find();
    return res.render("projects", { projects });
  } catch (error) {
    console.error(error);
    return res.status(500).render("error");
  }
});

router.get("/projects/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).render("notFound");
    }

    project.content = converter.makeHtml(project.content);

    return res.render("project", { project });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).render("notFound");
    }
    console.error(error);
    return res.status(500).render("error");
  }
});

router.get("/admin/login", async (req, res) => {
  const { accessToken, refreshToken } = req.cookies;

  if (accessToken) {
    const user = await validateAccessToken(accessToken);
    if (user) {
      return res.redirect("/admin");
    }
  }

  if (refreshToken) {
    const token = await validateRefreshToken(refreshToken);
    if (token) {
      const tokens = await refreshBothTokens(refreshToken);
      if (tokens) {
        res.cookie("accessToken", tokens.accessToken, {
          httpOnly: true,
          sameSite: "strict",
          expires: new Date(Date.now() + 10 * 60 * 1000),
        });
        res.cookie("refreshToken", tokens.refreshToken, {
          httpOnly: true,
          sameSite: "strict",
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        return res.redirect("/admin");
      }
    }
  }

  res.render("admin/login");
});

router.get("/admin", authMiddleware, async (req, res) => {
  res.render("admin/index", { user: req.user });
});

module.exports = router;
