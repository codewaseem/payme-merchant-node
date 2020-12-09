import express from "express";
import config from "./config";
import logger from "./utils/logger";
import bodyParser from "body-parser";
import Application from "./merchant/Application";
import Database from "./merchant/Database";

const startServer = async () => {
  const dbConnection = await Database.db();

  logger.info(`DB connected ${dbConnection.isConnected}`);

  const app = express();

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.post("/merchant", (req, res) => {
    const application = new Application(req, res);
    application.run();
  });

  app.get("/status", (req, res) => {
    res.send("App is running");
  });

  app.listen(config.PORT, async () => {
    logger.info(`Server listening at ${config.PORT}`);
  });
};

startServer();
