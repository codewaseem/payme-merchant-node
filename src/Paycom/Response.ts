import { Response as ExpressResponse } from "express";
import PaycomException from "./PaycomException";
import Request from "./Request";

export default class Response {
  /**
   * Response constructor.
   * @param Request $request request object.
   */
  constructor(private req: Request, private res: ExpressResponse) {}

  /**
   * Sends response with the given result and error.
   * @param mixed $result result of the request.
   * @param mixed|null $error error.
   */
  send(result: any, error = null): void {
    const response = {
      jsonrpc: "2.0",
      id: this.req.id,
      result,
      error,
    };

    this.res.json(response);
  }

  /**
   * Generates PaycomException exception with given parameters.
   * @param int $code error code.
   * @param string|array $message error message.
   * @param string $data parameter name, that resulted to this error.
   * @throws PaycomException
   */
  error(code: number, message = null, data = null): void {
    throw new PaycomException(this.req.id, message, code, data);
  }
}
