import { Router } from "express";
import Merchant from "./Merchant";
import Request from "./Request";
import Response from "./Response";

const Application = Router();

// use merchant authorization by middleware

Application.post("/", (req, res) => {
  try {
    const request = new Request(req);
    const response = new Response(request, res);
    const merchant = new Merchant(req);

    merchant.Authorize(request.id);

    res.send("ok");
  } catch (e) {
    res.send(e);
  }
  res.send("ok");
});

export default Application;
