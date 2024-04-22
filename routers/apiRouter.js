const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const RefreshToken = require("../models/refreshToken");

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "10m",
  });
};

const generateRefreshToken = async (userId) => {
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  const newRefreshToken = new RefreshToken({
    token: refreshToken,
    userId,
  });
  await newRefreshToken.save();

  return refreshToken;
};

const validateAccessToken = async (accessToken) => {
  try {
    const token = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(token.userId);
    if (!user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
};

const validateRefreshToken = async (refreshToken) => {
  try {
    const token = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const storedToken = await RefreshToken.findOne({ token: refreshToken });

    if (!storedToken) {
      return null;
    }

    return token;
  } catch {
    return null;
  }
};

const refreshBothTokens = async (refreshToken) => {
  const token = await validateRefreshToken(refreshToken);
  if (!token) {
    return null;
  }

  await RefreshToken.deleteOne({ token: refreshToken });

  const accessToken = generateAccessToken(token.userId);
  const newRefreshToken = await generateRefreshToken(token.userId);

  return { accessToken, refreshToken: newRefreshToken };
};

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

router.patch("/auth/password", async (req, res) => {
  // change user password
});

router.post("/projects/:id", async (req, res) => {
  // add project to database
});

module.exports = router;
