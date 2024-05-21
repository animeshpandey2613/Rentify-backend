const mongoose = require("mongoose");
const dotenv = require("dotenv");
const serverless = require("serverless-http");
process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log("Uncaught Exception, Shutting down the server");
  process.exit(1);
});
dotenv.config({ path: "./config.env" });
const app = require("../app");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.PASSWORD
).replace("<USER>", process.env.USER);
mongoose.connect(DB).then(() => console.log("Database Connected"));

const server = serverless(app)
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("Unhandled rejection, Shutting down the server");
  server.close(() => {
    process.exit(1);
  });
});

module.exports.handler = server;
