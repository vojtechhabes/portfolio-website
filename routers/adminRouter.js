const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const {
  validateAccessToken,
  validateRefreshToken,
  refreshBothTokens,
} = require("../utils/tokenManagement");

router.get("/login", async (req, res) => {
  const { accessToken, refreshToken } = req.cookies;

  if (accessToken) {
    const user = await validateAccessToken(accessToken);
    if (user) {
      return res.redirect("/admin");
    }
  }

  if (refreshToken) {
    const token = await validateRefreshToken(refreshToken);
    if (token) {
      const tokens = await refreshBothTokens(refreshToken);
      if (tokens) {
        res.cookie("accessToken", tokens.accessToken, {
          httpOnly: true,
          sameSite: "strict",
          expires: new Date(Date.now() + 10 * 60 * 1000),
        });
        res.cookie("refreshToken", tokens.refreshToken, {
          httpOnly: true,
          sameSite: "strict",
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        return res.redirect("/admin");
      }
    }
  }

  res.render("admin/login");
});

router.get("/", authMiddleware, async (req, res) => {
  res.render("admin/index", { user: req.user });
});

router.get("/settings", authMiddleware, async (req, res) => {
  res.render("admin/settings", { user: req.user });
});
module.exports = router;
