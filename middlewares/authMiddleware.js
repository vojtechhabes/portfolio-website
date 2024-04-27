const bcrypt = require("bcrypt");
const User = require("../models/user");
const {
  validateAccessToken,
  refreshBothTokens,
} = require("../utils/tokenManagement");
const jwt = require("jsonwebtoken");

const passwordMiddleware = async (req, res, next) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({
      code: "missing-password",
      message: "A password is required.",
    });
  }

  try {
    const user = await User.findById(req.user._id);
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({
        code: "incorrect-password",
        message: "The provided password is incorrect.",
      });
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: "server-error",
      message: "An error occurred while processing the request.",
    });
  }
};

const authMiddleware = async (req, res, next) => {
  const { accessToken, refreshToken } = req.cookies;

  if (accessToken) {
    const user = await validateAccessToken(accessToken);
    if (user) {
      req.user = {
        _id: user._id,
        username: user.username,
        createdAt: user.createdAt,
      };
      return next();
    }

    return res.status(403).json({
      code: "invalid-token",
      message: "The provided access token is invalid.",
    });
  } else if (refreshToken) {
    const newTokens = await refreshBothTokens(refreshToken);

    if (newTokens) {
      res.cookie("accessToken", newTokens.accessToken, {
        httpOnly: true,
        sameSite: "strict",
      });
      res.cookie("refreshToken", newTokens.refreshToken, {
        httpOnly: true,
        sameSite: "strict",
      });

      const userId = jwt.decode(newTokens.accessToken).userId;

      try {
        const user = await User.findById(userId);
        req.user = {
          _id: user._id,
          username: user.username,
          createdAt: user.createdAt,
        };

        return next();
      } catch (error) {
        console.error(error);
        return res.status(500).json({
          code: "server-error",
          message: "An error occurred while processing the request.",
        });
      }
    }

    return res.status(403).json({
      code: "invalid-token",
      message: "The provided refresh token is invalid.",
    });
  }

  return res.redirect("/admin/login");
};

module.exports = { authMiddleware, passwordMiddleware };
