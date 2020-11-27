import { Request as ExpressRequest } from "express";
import PaycomException from "./PaycomException";

export default class Request {
  /** @var array decoded request payload */
  public payload: any;

  /** @var int id of the request */
  public id!: number | null;

  /** @var string method name, such as <em>CreateTransaction</em> */
  public method!: string | null;

  /** @var object request parameters, such as <em>amount</em>, <em>account</em> */
  public params: {
    amount: number;
    request_id: number | null;
    account: { [key: string]: any };
  };

  /** @var int amount value in coins */
  public amount!: number | null;

  private req: ExpressRequest;

  /**
   * Request constructor.
   * Parses request payload and populates properties with values.
   */
  constructor(req: ExpressRequest) {
    this.req = req;
    this.payload = this.req.body;

    if (!this.req.body) {
      throw new PaycomException(
        null,
        "Invalid JSON-RPC object.",
        PaycomException.ERROR_INVALID_JSON_RPC_OBJECT
      );
    }

    // populate request object with data
    this.id = this.payload.id ? +this.payload.id : null;
    this.method = this.payload.method
      ? String(this.payload.method).trim()
      : null;
    this.params = this.payload.params ? this.payload.params : {};
    this.amount = this.payload.params?.amount
      ? Number(this.payload.params.amount)
      : null;

    // add request id into params too
    this.params.request_id = this.id;
  }

  /**
   * Gets account parameter if such exists, otherwise returns null.
   * @param string $param name of the parameter.
   * @return mixed|null account parameter value or null if such parameter doesn't exists.
   */
  account(param: string): any | null {
    if (this.params.account && this.params.account[param]) {
      return this.params.account[param];
    }
  }
}
