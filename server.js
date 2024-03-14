const express = require("express");
require("dotenv").config();

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));

const mainRouter = require("./routers/main");
app.use("/", mainRouter);

const startServer = async () => {
  await app.listen(process.env.PORT);
  console.log(`Server is running on port ${process.env.PORT}.`);
};

startServer();
