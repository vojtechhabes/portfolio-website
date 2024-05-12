const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { rateLimit } = require("express-rate-limit");
const requestIp = require("request-ip");
require("dotenv").config();

const whitelist = process.env.CORS_WHITELIST.split(",");
const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(
        {
          code: "cors-not-allowed",
          message: "This origin is not allowed to access the API.",
        },
        false
      );
    }
  },
};

const app = express();

/*
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  message: {
    code: "rate-limit-exceeded",
    message: "Too many requests from this IP, please try again later.",
  },
  keyGenerator: (req) => {
    return req.clientIp;
  },
});
*/

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(requestIp.mw());
app.use(cookieParser());
app.use("/api", cors(corsOptions));
// app.use("/api", limiter);
app.use("/api", express.json());
app.use("/api", (error, req, res, next) => {
  if (error instanceof SyntaxError) {
    res.status(error.status).json({
      code: "invalid-request",
      message: "The provided request was not a valid JSON.",
    });
  } else if (error.code === "cors-not-allowed") {
    res.status(403).json(error);
  } else {
    next();
  }
});

const mainRouter = require("./routers/mainRouter");
app.use("/", mainRouter);

const adminRouter = require("./routers/adminRouter");
app.use("/admin", adminRouter);

const apiRouter = require("./routers/apiRouter");
app.use("/api", apiRouter);

app.use((req, res) => {
  res.status(404).render("notFound");
});

const startServer = async () => {
  let noDb = false;
  try {
    console.log(`Connecting to database...`);
    await mongoose.connect(process.env.DB_URI);
    const db = mongoose.connection;
    console.log(`Connected to database ${db.db.databaseName}.`);
  } catch (error) {
    noDb = true;
    console.error(`Error while connecting to database: ${error.message}`);
  }

  try {
    console.log("Starting server...");
    await app.listen(process.env.PORT || 3000);
    console.log(`Server is running on port ${process.env.PORT}.`);
    if (noDb) {
      console.log(
        "Warning: The server is running without a database connection."
      );
    }
  } catch (error) {
    console.error(`Error while starting server: ${error.message}`);
  }
};

startServer();
