const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");
const RefreshToken = require("../models/refreshToken");
const Project = require("../models/project");
const {
  generateAccessToken,
  generateRefreshToken,
  refreshBothTokens,
  validateRefreshToken,
} = require("../utils/tokenManagement");
const {
  authMiddleware,
  passwordMiddleware,
} = require("../middlewares/authMiddleware");

router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({
      code: "missing-credentials",
      message: "Both username and password are required.",
    });
  }

  try {
    let user = await User.findOne({ username });

    if (!user) {
      const salt = await bcrypt.genSalt();
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = new User({
        username,
        passwordHash,
      });

      await newUser.save();

      user = newUser;
    } else {
      const passwordMatch = await bcrypt.compare(password, user.passwordHash);

      if (!passwordMatch) {
        return res.status(401).json({
          code: "incorrect-credentials",
          message: "The provided credentials are incorrect.",
        });
      }
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        username: user.username,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: "server-error",
      message: "An error occurred while processing the request.",
    });
  }
});

router.post("/auth/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({
      code: "missing-token",
      message: "A refresh token is required.",
    });
  }

  const tokens = await refreshBothTokens(refreshToken);
  if (!tokens) {
    return res.status(401).json({
      code: "invalid-token",
      message: "The provided refresh token is invalid.",
    });
  }

  return res.status(200).json(tokens);
});

router.post("/auth/logout", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({
      code: "missing-token",
      message: "A refresh token is required.",
    });
  }

  try {
    const token = await validateRefreshToken(refreshToken);
    if (!token) {
      return res.status(401).json({
        code: "invalid-token",
        message: "The provided refresh token is invalid.",
      });
    }
    await RefreshToken.deleteOne({ token: refreshToken });

    return res.status(200).json({
      code: "logout-success",
      message: "The user has been successfully logged out.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: "server-error",
      message: "An error occurred while processing the request.",
    });
  }
});

router.patch(
  "/auth/password",
  authMiddleware,
  passwordMiddleware,
  async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({
        code: "missing-password",
        message: "A new password is required.",
      });
    }

    try {
      const salt = await bcrypt.genSalt();
      const passwordHash = await bcrypt.hash(newPassword, salt);

      await User.updateOne({ _id: req.user._id }, { passwordHash });
      await RefreshToken.deleteMany({ userId: req.user._id });

      return res.status(200).json({
        code: "password-updated",
        message:
          "The user's password has been successfully updated. You will need to log in again.",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        code: "server-error",
        message: "An error occurred while processing the request.",
      });
    }
  }
);

router.post("/project", authMiddleware, async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({
      code: "missing-title",
      message: "A title is required.",
    });
  }

  try {
    const newProject = new Project({
      title,
      userId: req.user._id,
    });

    await newProject.save();

    return res.status(201).json({
      code: "project-created",
      message: "The project has been successfully created.",
      project: {
        _id: newProject._id,
        title: newProject.title,
        published: newProject.published,
        userId: newProject.userId,
        createdAt: newProject.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: "server-error",
      message: "An error occurred while processing the request.",
    });
  }
});

router.delete(
  "/project/:id",
  authMiddleware,
  passwordMiddleware,
  async (req, res) => {
    const { id } = req.params;

    try {
      const project = await Project.findOne({ _id: id });
      if (!project) {
        return res.status(404).json({
          code: "project-not-found",
          message: "The project with the provided ID was not found.",
        });
      }

      await Project.deleteOne({ _id: id });

      return res.status(200).json({
        code: "project-deleted",
        message: "The project has been successfully deleted.",
      });
    } catch (error) {
      if (error.name === "CastError") {
        return res.status(400).json({
          code: "invalid-id",
          message: "The provided ID is not a valid project ID.",
        });
      } else {
        console.error(error);
        return res.status(500).json({
          code: "server-error",
          message: "An error occurred while processing the request.",
        });
      }
    }
  }
);

router.get("/project", authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user._id });

    return res.status(200).json({
      code: "projects-found",
      projects: projects.map((project) => ({
        _id: project._id,
        title: project.title,
        content: project.content,
        description: project.description,
        published: project.published,
        userId: project.userId,
        createdAt: project.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: "server-error",
      message: "An error occurred while processing the request.",
    });
  }
});

router.patch("/project/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, content, published, description } = req.body;

  try {
    const project = await Project.findOne({ _id: id });
    if (!project) {
      return res.status(404).json({
        code: "project-not-found",
        message: "The project with the provided ID was not found.",
      });
    }

    if (title) {
      if (typeof title !== "string") {
        return res.status(400).json({
          code: "invalid-title",
          message: "The title field must be a string.",
        });
      }
      project.title = title;
    }

    if (content !== undefined) {
      if (typeof content !== "string") {
        return res.status(400).json({
          code: "invalid-content",
          message: "The content field must be a string.",
        });
      }
      project.content = content;
    }

    if (published !== undefined) {
      if (typeof published !== "boolean") {
        return res.status(400).json({
          code: "invalid-published",
          message: "The published field must be a boolean.",
        });
      }
      project.published = published;
    }

    if (description) {
      if (typeof description !== "string") {
        return res.status(400).json({
          code: "invalid-description",
          message: "The description field must be a string.",
        });
      }
      project.description = description;
    }

    await project.save();

    return res.status(200).json({
      code: "project-updated",
      message: "The project has been successfully updated.",
      project: {
        _id: project._id,
        title: project.title,
        content: project.content,
        description: project.description,
        published: project.published,
        userId: project.userId,
        createdAt: project.createdAt,
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        code: "invalid-id",
        message: "The provided ID is not a valid project ID.",
      });
    }
    console.error(error);
    return res.status(500).json({
      code: "server-error",
      message: "An error occurred while processing the request.",
    });
  }
});

module.exports = router;
