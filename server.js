const express = require("express");
const mongoose = require("mongoose");
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
  try {
    await mongoose.connect(process.env.DB_URI);
    const db = mongoose.connection;
    console.log(`Connected to database ${db.db.databaseName}.`);

    await app.listen(process.env.PORT);
    console.log(`Server is running on port ${process.env.PORT}.`);
  } catch (error) {
    console.error(`Error while starting server: ${error.message}`);
  }
};

startServer();
