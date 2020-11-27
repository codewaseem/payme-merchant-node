import { Router } from "express";
import Merchant from "./Merchant";

const Application = Router();

// use merchant as middleware
Application.use(Merchant);

Application.post("/", (req, res) => {
  res.send("ok");
});

export default Application;
