const { validateAccessToken } = require("../utils/tokenManagement");

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

  req.user = user;
  next();
};

module.exports = authMiddleware;
