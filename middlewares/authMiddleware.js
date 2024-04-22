const { validateAccessToken } = require("../utils/tokenManagement");
const bcrypt = require("bcrypt");
const User = require("../models/user");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const accessToken = authHeader && authHeader.split(" ")[1];

  if (!accessToken) {
    return res.status(401).json({
      code: "missing-token",
      message: "An access token is required.",
    });
  }

  const user = await validateAccessToken(accessToken);
  if (!user) {
    return res.status(403).json({
      code: "invalid-token",
      message: "The provided access token is invalid.",
    });
  }

  req.user = {
    _id: user._id,
    username: user.username,
    createdAt: user.createdAt,
  };

  next();
};

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

module.exports = { authMiddleware, passwordMiddleware };
