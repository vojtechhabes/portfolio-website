/*
Zdroje:
- https://expressjs.com/en/resources/middleware/cors.html
- https://www.w3schools.com/js/js_cookies.asp
- https://stackoverflow.com/questions/44816519/how-to-get-cookie-value-in-expressjs
- https://stackoverflow.com/questions/3507958/how-can-i-make-an-entire-html-form-readonly
*/

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const corsOptions = {
  origin: `http://localhost:${process.env.PORT || 3000}`,
  optionsSuccessStatus: 200,
};

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(cors(corsOptions));
app.use(cookieParser());
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
    await mongoose.connect(process.env.DB_URI);
    const db = mongoose.connection;
    console.log(`Connected to database ${db.db.databaseName}.`);
  } catch (error) {
    noDb = true;
    console.error(`Error while connecting to database: ${error.message}`);
  }

  try {
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
