import express from "express";
import config from "./config";
import logger from "./utils/logger";
import bodyParser from "body-parser";
import Application from "./Paycom/Application";

const startServer = async () => {
  const app = express();

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.use(Application);

  app.listen(config.PORT, () => {
    logger.info(`Server listening at ${config.PORT}`);
  });
};

startServer();
