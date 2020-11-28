import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import Merchant from "./Merchant";
import Request from "./Request";
import Response from "./Response";
import PaycomException from "./PaycomException";
import Order, { OrderState } from "./Order";
import { CancelReason, Transaction, TransactionState } from "./Transaction";
import Format from "./Format";

export default class Application {
  public request;
  public response;
  public merchant;

  /**
   * Application constructor.
   * @param array $config configuration array with <em>merchant_id</em>, <em>login</em>, <em>keyFile</em> keys.
   */
  public constructor(req: ExpressRequest, res: ExpressResponse) {
    this.request = new Request(req);
    this.response = new Response(this.request, res);
    this.merchant = new Merchant(req);
  }

  /**
   * Authorizes session and handles requests.
   */
  public async run(): Promise<void> {
    try {
      // authorize session
      this.merchant.Authorize(this.request.id);

      // handle request
      switch (this.request.method) {
        case "CheckPerformTransaction":
          await this.CheckPerformTransaction();
          break;
        case "CheckTransaction":
          await this.CheckTransaction();
          break;
        case "CreateTransaction":
          await this.CreateTransaction();
          break;
        case "PerformTransaction":
          await this.PerformTransaction();
          break;
        case "CancelTransaction":
          await this.CancelTransaction();
          break;
        case "ChangePassword":
          await this.ChangePassword();
          break;
        case "GetStatement":
          await this.GetStatement();
          break;
        default:
          this.response.error(
            PaycomException.ERROR_METHOD_NOT_FOUND,
            "Method not found.",
            this.request.method
          );
          break;
      }
    } catch (e) {
      e.send();
    }
  }

  private async CheckPerformTransaction() {
    const order = new Order(this.request.id);
    order.find(this.request.params["account"]);

    // validate parameters
    order.validate(this.request.params);

    // todo: Check is there another active or completed transaction for this order
    const transaction = new Transaction();
    const found = await transaction.find(this.request.params);
    if (
      found &&
      (found.state == TransactionState.STATE_CREATED ||
        found.state == TransactionState.STATE_COMPLETED)
    ) {
      this.response.error(
        PaycomException.ERROR_COULD_NOT_PERFORM,
        "There is other active/completed transaction for this order."
      );
    }

    // if control is here, then we pass all validations and checks
    // send response, that order is ready to be paid.
    this.response.send({ allow: true });
  }

  private async CheckTransaction() {
    // todo: Find transaction by id
    const transaction = new Transaction();
    const found = await transaction.find(this.request.params);
    if (!found) {
      return this.response.error(
        PaycomException.ERROR_TRANSACTION_NOT_FOUND,
        "Transaction not found."
      );
    } else {
      // todo: Prepare and send found transaction
      this.response.send({
        create_time: Format.datetime2timestamp(found.create_time),
        perform_time: Format.datetime2timestamp(found.perform_time),
        cancel_time: Format.datetime2timestamp(found.cancel_time),
        transaction: found.id,
        state: found.state,
        reason: found.reason ? found.reason : null,
      });
    }
  }

  private async CreateTransaction() {
    const order = new Order(this.request.id);
    order.find(this.request.params["account"]);

    // validate parameters
    order.validate(this.request.params);

    // todo: Check, is there any other transaction for this order/service
    let transaction = new Transaction();
    let found = await transaction.find({
      account: this.request.params["account"],
    });
    if (found) {
      if (
        (found.state == TransactionState.STATE_CREATED ||
          found.state == TransactionState.STATE_COMPLETED) &&
        found.paycom_transaction_id != this.request.params["id"]
      ) {
        this.response.error(
          PaycomException.ERROR_INVALID_ACCOUNT,
          "There is other active/completed transaction for this order."
        );
      }
    }

    // todo: Find transaction by id
    transaction = new Transaction();
    found = await transaction.find(this.request.params);

    if (found) {
      if (found.state != TransactionState.STATE_CREATED) {
        // validate transaction state
        this.response.error(
          PaycomException.ERROR_COULD_NOT_PERFORM,
          "Transaction found, but is not active."
        );
      } else if (found.isExpired()) {
        // if transaction timed out, cancel it and send error
        found.cancel(CancelReason.REASON_CANCELLED_BY_TIMEOUT);
        this.response.error(
          PaycomException.ERROR_COULD_NOT_PERFORM,
          "Transaction is expired."
        );
      } else {
        // if transaction found and active, send it as response
        this.response.send({
          create_time: Format.datetime2timestamp(found.create_time),
          transaction: found.id,
          state: found.state,
          receivers: found.receivers,
        });
      }
    } else {
      // transaction not found, create new one

      // validate new transaction time
      if (
        Format.timestamp2milliseconds(this.request.params["time"]) -
          Format.timestamp(true) >=
        Transaction.TIMEOUT
      ) {
        this.response.error(
          PaycomException.ERROR_INVALID_ACCOUNT,
          PaycomException.message(
            "С даты создания транзакции прошло " + Transaction.TIMEOUT + "мс",
            "Tranzaksiya yaratilgan sanadan " +
              Transaction.TIMEOUT +
              "ms o`tgan",
            "Since create time of the transaction passed " +
              Transaction.TIMEOUT +
              "ms"
          ),
          "time"
        );
      }

      // create new transaction
      // keep create_time as timestamp, it is necessary in response
      const create_time = Format.timestamp(true);
      transaction.paycom_transaction_id = this.request.params["id"];
      transaction.paycom_time = this.request.params["time"];
      transaction.paycom_time_datetime = Format.timestamp2datetime(
        this.request.params["time"]
      );
      transaction.create_time = Format.timestamp2datetime(create_time);
      transaction.state = TransactionState.STATE_CREATED;
      transaction.amount = this.request.amount ?? 0;
      transaction.order_id = this.request.account("order_id");
      await transaction.save(); // after save $transaction.id will be populated with the newly created transaction's id.

      // send response
      this.response.send({
        create_time: create_time,
        transaction: transaction.id,
        state: transaction.state,
        receivers: null,
      });
    }
  }

  private async PerformTransaction() {
    const transaction = new Transaction();
    // search transaction by id
    const found = await transaction.find(this.request.params);

    // if transaction not found, send error
    if (!found) {
      return this.response.error(
        PaycomException.ERROR_TRANSACTION_NOT_FOUND,
        "Transaction not found."
      );
    }

    switch (found.state) {
      case TransactionState.STATE_CREATED: // handle active transaction
        if (found.isExpired()) {
          // if transaction is expired, then cancel it and send error
          found.cancel(CancelReason.REASON_CANCELLED_BY_TIMEOUT);
          this.response.error(
            PaycomException.ERROR_COULD_NOT_PERFORM,
            "Transaction is expired."
          );
        } else {
          // perform active transaction
          // todo: Mark order/service as completed
          const params = { order_id: found.order_id };
          const order = new Order(this.request.id);
          order.find(params);
          order.changeState(OrderState.STATE_PAY_ACCEPTED);

          // todo: Mark transaction as completed
          const perform_time = Format.timestamp(true);
          found.state = TransactionState.STATE_COMPLETED;
          found.perform_time = Format.timestamp2datetime(perform_time);
          found.save();

          this.response.send({
            transaction: found.id,
            perform_time: perform_time,
            state: found.state,
          });
        }
        break;

      case TransactionState.STATE_COMPLETED: // handle complete transaction
        // todo: If transaction completed, just return it
        this.response.send({
          transaction: found.id,
          perform_time: Format.datetime2timestamp(found.perform_time),
          state: found.state,
        });
        break;

      default:
        // unknown situation
        this.response.error(
          PaycomException.ERROR_COULD_NOT_PERFORM,
          "Could not perform this operation."
        );
        break;
    }
  }

  private async CancelTransaction() {
    const transaction = new Transaction();

    // search transaction by id
    const found = await transaction.find(this.request.params);

    // if transaction not found, send error
    if (!found) {
      return this.response.error(
        PaycomException.ERROR_TRANSACTION_NOT_FOUND,
        "Transaction not found."
      );
    }

    switch (found.state) {
      // if already cancelled, just send it
      case TransactionState.STATE_CANCELLED:
      case TransactionState.STATE_CANCELLED_AFTER_COMPLETE:
        this.response.send({
          transaction: found.id,
          cancel_time: Format.datetime2timestamp(found.cancel_time),
          state: found.state,
        });
        break;

      // cancel active transaction
      case TransactionState.STATE_CREATED:
        {
          // cancel transaction with given reason
          found.cancel(this.request.params["reason"]);
          // after $found->cancel(), cancel_time and state properties populated with data

          // change order state to cancelled
          const order = new Order(this.request.id);
          order.find(this.request.params);
          order.changeState(OrderState.STATE_CANCELLED);

          // send response
          this.response.send({
            transaction: found.id,
            cancel_time: Format.datetime2timestamp(found.cancel_time),
            state: found.state,
          });
        }
        break;

      case TransactionState.STATE_COMPLETED:
        {
          // find order and check, whether cancelling is possible this order
          const order = new Order(this.request.id);
          order.find(this.request.params);
          if (order.allowCancel()) {
            // cancel and change state to cancelled
            found.cancel(1 * this.request.params["reason"]);
            // after $found.cancel(), cancel_time and state properties populated with data

            order.changeState(OrderState.STATE_CANCELLED);

            // send response
            this.response.send({
              transaction: found.id,
              cancel_time: Format.datetime2timestamp(found.cancel_time),
              state: found.state,
            });
          } else {
            // todo: If cancelling after performing transaction is not possible, then return error -31007
            this.response.error(
              PaycomException.ERROR_COULD_NOT_CANCEL,
              "Could not cancel transaction. Order is delivered/Service is completed."
            );
          }
        }
        break;
    }
  }

  private ChangePassword() {
    // validate, password is specified, otherwise send error
    if (
      this.request.params["password"] ||
      String(this.request.params["password"]).trim()
    ) {
      return this.response.error(
        PaycomException.ERROR_INVALID_ACCOUNT,
        "New password not specified.",
        "password"
      );
    }

    // if current password specified as new, then send error
    if (this.merchant.isSamePassword(this.request.params["password"])) {
      return this.response.error(
        PaycomException.ERROR_INSUFFICIENT_PRIVILEGE,
        "Insufficient privilege. Incorrect new password."
      );
    }

    // todo: Implement saving password into data store or file
    // example implementation, that saves new password into file specified in the configuration
    try {
      this.merchant.updatePassword(this.request.params["password"]);
      this.response.send({ success: true });
    } catch (e) {
      return this.response.error(
        PaycomException.ERROR_INTERNAL_SYSTEM,
        "Internal System Error."
      );
    }
  }

  private async GetStatement() {
    // validate 'from'
    if (!this.request.params["from"]) {
      this.response.error(
        PaycomException.ERROR_INVALID_ACCOUNT,
        "Incorrect period.",
        "from"
      );
    }

    // validate 'to'
    if (!this.request.params["to"]) {
      this.response.error(
        PaycomException.ERROR_INVALID_ACCOUNT,
        "Incorrect period.",
        "to"
      );
    }

    // validate period
    if (+this.request.params["from"] >= +this.request.params["to"]) {
      this.response.error(
        PaycomException.ERROR_INVALID_ACCOUNT,
        "Incorrect period. (from >= to)",
        "from"
      );
    }

    // get list of transactions for specified period
    const transaction = new Transaction();
    const reports = await transaction.report(
      this.request.params["from"],
      this.request.params["to"]
    );

    // send results back
    this.response.send({ transactions: reports });
  }
}
