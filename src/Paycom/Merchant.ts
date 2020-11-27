import { NextFunction, Request, Response, Router } from "express";
import { readFileSync } from "fs";
import { join } from "path";
import auth from "basic-auth";
import paycomConfig from "../paycom.config";
import PaycomException from "./PaycomException";

const username = paycomConfig.login;
const password = readFileSync(
  join(process.cwd(), paycomConfig.keyFile)
).toString();

export default function Merchant(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = auth(req);
  if (!user || user.name != username || user.pass != password) {
    new PaycomException(
      1,
      "Insufficient privilege to perform this method.",
      PaycomException.ERROR_INSUFFICIENT_PRIVILEGE
    ).send(res);
  } else {
    (req as any).user = user;
    next();
  }
}
