import { Request } from "express";
import { readFileSync } from "fs";
import { join } from "path";
import auth from "basic-auth";
import paycomConfig from "../paycom.config";
import PaycomException from "./PaycomException";
import { writeFileSync } from "fs";

const keypath = join(process.cwd(), paycomConfig.keyFile);
const username = paycomConfig.login;
const initialPassword = readFileSync(keypath).toString();

export default class Merchant {
  private currentPassword: string = initialPassword;

  constructor(private req: Request) {}

  public Authorize(request_id: number | null): void {
    this.currentPassword = readFileSync(keypath).toString();
    const user = auth(this.req);
    if (!user || user.name != username || user.pass != this.currentPassword) {
      throw new PaycomException(
        request_id,
        "Insufficient privilege to perform this method.",
        PaycomException.ERROR_INSUFFICIENT_PRIVILEGE
      );
    }
    return;
  }

  public isSamePassword(pass: string): boolean {
    return this.currentPassword == pass;
  }

  public updatePassword(newPassword: string): void {
    writeFileSync(keypath, newPassword);
  }
}
