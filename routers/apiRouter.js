const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");
const RefreshToken = require("../models/refreshToken");
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

router.post("/projects/:id", async (req, res) => {
  // add project to database
});

module.exports = router;
