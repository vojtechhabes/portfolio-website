const express = require("express");
require("dotenv").config();

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/api", express.json());
app.use("/api", (error, req, res, next) => {
  if (error instanceof SyntaxError) {
    res.status(error.status).json({
      code: "invalid-request",
      message: "The provided request was not a valid JSON.",
    });
  } else {
    next();
  }
});

const mainRouter = require("./routers/mainRouter");
app.use("/", mainRouter);

const apiRouter = require("./routers/apiRouter");
app.use("/api", apiRouter);

const startServer = async () => {
  await app.listen(process.env.PORT);
  console.log(`Server is running on port ${process.env.PORT}.`);
};

startServer();
