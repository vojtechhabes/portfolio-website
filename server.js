const express = require("express");
const app = express();
require("dotenv").config();

app.get("/", function (req, res) {
  res.send("Hello World");
});

const startServer = async () => {
  await app.listen(process.env.PORT);
  console.log(`Server is running on port ${process.env.PORT}.`);
};

startServer();
