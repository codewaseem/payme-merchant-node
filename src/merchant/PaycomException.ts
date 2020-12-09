import { Response } from "express";

type ErrorFormat = {
  code: number;
  message?: string;
  data?: string | null;
};

type ErrorResponse = {
  id: number | null;
  result: null;
  error: ErrorFormat;
};

export default class PaycomException extends Error {
  public request_id: number | null;
  public data?: string | null;

  public error!: ErrorFormat;

  /**
   * PaycomException constructor.
   * @param int request_id id of the request.
   * @param string|array $message error message.
   * @param int $code error code.
   * @param string|null $data parameter name, that resulted to this error.
   */
  constructor(
    request_id: number | null,
    message: string | null,
    code: number,
    data: string | null = null
  ) {
    super(message || "");
    this.request_id = request_id;
    this.data = data;

    // prepare error data
    this.error = {
      code,
    };
    if (message) {
      this.error.message = message;
    }
    if (data) {
      this.error.data = data;
    }
  }

  async send(res: Response): Promise<void> {
    const response = {
      id: this.request_id,
      result: null,
      error: this.error,
    };

    res.json(response);
  }

  response(): ErrorResponse {
    return {
      id: this.request_id,
      result: null,
      error: this.error,
    };
  }

  static ERROR_INTERNAL_SYSTEM = -32400;
  static ERROR_INSUFFICIENT_PRIVILEGE = -32504;
  static ERROR_INVALID_JSON_RPC_OBJECT = -32600;
  static ERROR_METHOD_NOT_FOUND = -32601;
  static ERROR_INVALID_AMOUNT = -31001;
  static ERROR_TRANSACTION_NOT_FOUND = -31003;
  static ERROR_INVALID_ACCOUNT = -31050;
  static ERROR_COULD_NOT_CANCEL = -31007;
  static ERROR_COULD_NOT_PERFORM = -31008;

  static message(ru: string, uz = "", en = ""): any {
    return {
      ru,
      uz,
      en,
    };
  }
}
