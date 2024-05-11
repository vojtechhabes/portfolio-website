/*
Zdroje:
- dokumentace všech použitých knihoven
- https://expressjs.com/en/resources/middleware/cors.html
- https://www.w3schools.com/js/js_cookies.asp
- https://stackoverflow.com/questions/44816519/how-to-get-cookie-value-in-expressjs
- https://stackoverflow.com/questions/3507958/how-can-i-make-an-entire-html-form-readonly
- https://chat.openai.com/share/13b93fa5-9413-48f6-b482-9081167a6b9e
- https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-padding
- https://stackoverflow.com/questions/572768/styling-an-input-type-file-button/37183065
- https://chat.openai.com/share/03e90f2c-fdea-494a-82c5-bd3a091fae69
- https://stackoverflow.com/questions/49173287/finding-location-through-ip-address-nodejs-mongodb
- https://stackoverflow.com/questions/22252472/how-can-i-change-the-color-of-an-svg-element
- https://stackoverflow.com/questions/115983/how-do-i-add-an-empty-directory-to-a-git-repository
- https://chat.openai.com/share/0f1df4c3-0295-47d9-9aec-b1e46739d37d
- https://stackoverflow.com/questions/57955612/can-we-use-webp-extension-image-in-ogimage-meta-tag
*/

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

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  message: {
    code: "rate-limit-exceeded",
    message: "Too many requests from this IP, please try again later.",
  },
  keyGenerator: (req) => req.clientIp,
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(requestIp.mw());
app.use(cookieParser());
app.use("/api", cors(corsOptions));
app.use("/api", limiter);
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
