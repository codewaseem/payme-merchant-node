import express from "express";
import config from "./config";
import logger from "./utils/logger";
import bodyParser from "body-parser";
import Application from "./Paycom/Application";
import Database from "./Paycom/Database";
import OrderEntity from "./Paycom/entities/OrderEntity";
import { getManager } from "typeorm";
import Order from "./Paycom/Order";

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

  app.get("/status", (req, res) => {
    res.send("App is running");
  });

  app.listen(config.PORT, async () => {
    logger.info(`Server listening at ${config.PORT}`);
    const testOrder = await getManager().save(OrderEntity, {
      product_ids: `["1","2","3"]`,
      amount: 150,
      state: 1,
      user_id: 123,
      phone: `987654321`,
    });
    console.log(testOrder);
  });
};

startServer();
