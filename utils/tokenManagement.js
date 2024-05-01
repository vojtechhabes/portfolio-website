const jwt = require("jsonwebtoken");
const User = require("../models/user");
const RefreshToken = require("../models/refreshToken");

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "10m",
  });
};

const generateRefreshToken = async (userId, fromIp) => {
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  const newRefreshToken = new RefreshToken({
    token: refreshToken,
    userId,
    fromIp,
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

const refreshBothTokens = async (refreshToken, fromIp) => {
  const token = await validateRefreshToken(refreshToken);
  if (!token) {
    return null;
  }

  await RefreshToken.deleteOne({ token: refreshToken });

  const accessToken = generateAccessToken(token.userId);
  const newRefreshToken = await generateRefreshToken(token.userId, fromIp);

  return { accessToken, refreshToken: newRefreshToken };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  validateAccessToken,
  validateRefreshToken,
  refreshBothTokens,
};
