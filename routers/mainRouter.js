const express = require("express");
const router = express.Router();
const Project = require("../models/project");
const showdown = require("showdown");
const fs = require("fs");
const path = require("path");

const converter = new showdown.Converter();

router.use((req, res, next) => {
  res.locals.url = req.protocol + "://" + req.get("host") + req.originalUrl;
  next();
});

router.get("/", async (req, res) => {
  try {
    const allProjects = await Project.find({ published: true }).sort({
      createdAt: "desc",
    });
    const starredProjects = allProjects.filter((project) => project.starred);

    return res.render("index", {
      starredProjects,
      remainingProjectsCount: allProjects.length - starredProjects.length,
      contactFormUrl: process.env.CONTACT_FORM_URL,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).render("error");
  }
});

router.get("/about", (req, res) => {
  res.render("about");
});

router.get("/projects", async (req, res) => {
  try {
    const projects = await Project.find({ published: true }).sort({
      createdAt: "desc",
    });
    return res.render("projects", { projects });
  } catch (error) {
    console.error(error);
    return res.status(500).render("error");
  }
});

router.get("/projects/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const project = await Project.findOne({ _id: id, published: true });
    if (!project) {
      return res.status(404).render("notFound");
    }

    project.content = converter.makeHtml(project.content);

    let image;
    try {
      const imagePath = path.join(
        __dirname,
        "..",
        "public",
        "images",
        "projects",
        `${id}.webp`
      );
      await fs.promises.access(imagePath);
      image = path.join("/images", "projects", `${id}.webp`);
    } catch {
      image = "/images/me2.webp";
    }

    return res.render("project", { project, image });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).render("notFound");
    }
    console.error(error);
    return res.status(500).render("error");
  }
});

module.exports = router;
