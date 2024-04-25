const express = require("express");
const router = express.Router();
const Project = require("../models/project");
const showdown = require("showdown");

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

router.get("/admin", (req, res) => {
  res.render("admin");
});

module.exports = router;
