import express from "express";
import config from "./config";
import logger from "./utils/logger";
import bodyParser from "body-parser";
import Application from "./Paycom/Application";
import Database from "./Paycom/Database";

const startServer = async () => {
  const dbConnection = await Database.db();

  logger.info(`DB connected ${dbConnection.isConnected}`);

  const app = express();

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.post("/", (req, res) => {
    const application = new Application(req, res);
    application.run();
  });

  app.listen(config.PORT, () => {
    logger.info(`Server listening at ${config.PORT}`);
  });
};

startServer();
