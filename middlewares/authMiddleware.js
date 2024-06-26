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

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.redirect("/admin/login");
  } else if (refreshToken) {
    const ip = req.clientIp;

    const newTokens = await refreshBothTokens(refreshToken, ip);

    if (newTokens) {
      res.cookie("accessToken", newTokens.accessToken, {
        httpOnly: true,
        sameSite: "strict",
        expires: new Date(Date.now() + 10 * 60 * 1000),
      });
      res.cookie("refreshToken", newTokens.refreshToken, {
        httpOnly: true,
        sameSite: "strict",
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.redirect("/admin/login");
  }

  return res.redirect("/admin/login");
};

module.exports = { authMiddleware, passwordMiddleware };
