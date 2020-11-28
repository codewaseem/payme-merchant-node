import { Between, getManager, In } from "typeorm";
import TransactionEntity from "./entities/TransactionEntity";
import Format from "./Format";
import PaycomException from "./PaycomException";

enum TransactionState {
  STATE_CREATED = 1,
  STATE_COMPLETED = 2,
  STATE_CANCELLED = -1,
  STATE_CANCELLED_AFTER_COMPLETE = -2,
}

enum Reason {
  REASON_RECEIVERS_NOT_FOUND = 1,
  REASON_PROCESSING_EXECUTION_FAILED = 2,
  REASON_EXECUTION_FAILED = 3,
  REASON_CANCELLED_BY_TIMEOUT = 4,
  REASON_FUND_RETURNED = 5,
  REASON_UNKNOWN = 10,
}

export class Transaction extends TransactionEntity {
  /** Transaction expiration time in milliseconds. 43 200 000 ms = 12 hours. */
  static TIMEOUT = 43200000;

  /**
   * Saves current transaction instance in a data store.
   * @return bool true - on success
   */
  public async save(): Promise<boolean> {
    // todo: Implement creating/updating transaction into data store
    // todo: Populate $id property with newly created transaction id

    // Example implementation

    try {
      const manager = getManager();

      if (!this.id) {
        // Create a new transaction

        this.create_time = Format.timestamp2datetime(Format.timestamp());
        const newTransaction = await manager.save(TransactionEntity, {
          ...this,
          receivers: JSON.stringify(this.receivers),
        });

        this.id = newTransaction.id;
      } else {
        // Update an existing transaction by id
        await manager.update(
          TransactionEntity,
          {
            id: this.id,
          },
          {
            ...this,
          }
        );
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Cancels transaction with the specified reason.
   * @param int $reason cancelling reason.
   * @return void
   */
  public async cancel(reason: number): Promise<void> {
    // todo: Implement transaction cancelling on data store

    // todo: Populate $cancel_time with value
    this.cancel_time = Format.timestamp2datetime(Format.timestamp());

    // todo: Change $state to cancelled (-1 or -2) according to the current state

    if (this.state == TransactionState.STATE_COMPLETED) {
      // Scenario: CreateTransaction -> PerformTransaction -> CancelTransaction
      this.state = TransactionState.STATE_CANCELLED_AFTER_COMPLETE;
    } else {
      // Scenario: CreateTransaction -> CancelTransaction
      this.state = TransactionState.STATE_CANCELLED;
    }

    // set reason
    this.reason = reason;

    // todo: Update transaction on data store
    await this.save();
  }

  /**
   * Determines whether current transaction is expired or not.
   * @return bool true - if current instance of the transaction is expired, false - otherwise.
   */
  public isExpired(): boolean {
    // todo: Implement transaction expiration check
    // for example, if transaction is active and passed TIMEOUT milliseconds after its creation, then it is expired
    return (
      this.state == TransactionState.STATE_CREATED &&
      Math.abs(
        Format.datetime2timestamp(this.create_time) - Format.timestamp(true)
      ) > Transaction.TIMEOUT
    );
  }

  /**
   * Find transaction by given parameters.
   * @param mixed $params parameters
   * @return Transaction|Transaction[]
   * @throws PaycomException invalid parameters specified
   */
  public async find(params: any): Promise<Transaction | Transaction[] | null> {
    const manager = getManager();

    let res: TransactionEntity[] | undefined;

    // todo: Implement searching transaction by id, populate current instance with data and return it
    if (params["id"]) {
      res = await manager.find(TransactionEntity, params["id"]);
    } else if (params["account"] && params["account"]["order_id"]) {
      // todo: Implement searching transactions by given parameters and return the list of transactions
      // search by order id active or completed transaction
      res = await manager.find(TransactionEntity, {
        where: {
          state: In([
            TransactionState.STATE_CREATED,
            TransactionState.STATE_COMPLETED,
          ]),
          order_id: params["account"]["order_id"],
        },
      });
    } else {
      throw new PaycomException(
        params["request_id"],
        "Parameter to find a transaction is not specified.",
        PaycomException.ERROR_INTERNAL_SYSTEM
      );
    }

    if (!res.length) return null;

    const transaction = res[0];

    this.id = transaction["id"];
    this.paycom_transaction_id = transaction["paycom_transaction_id"];
    this.paycom_time = transaction["paycom_time"];
    this.paycom_time_datetime = transaction["paycom_time_datetime"];
    this.create_time = transaction["create_time"];
    this.perform_time = transaction["perform_time"];
    this.cancel_time = transaction["cancel_time"];
    this.state = 1 * transaction["state"];
    this.reason = transaction["reason"] ? transaction["reason"] : null;
    this.amount = transaction["amount"];
    this.receivers = transaction["receivers"]
      ? JSON.parse(transaction["receivers"])
      : null;
    this.order_id = transaction["order_id"];

    return this;

    // Possible features:
    // Search transaction by product/order id that specified in $params
    // Search transactions for a given period of time that specified in $params
  }

  /**
   * Gets list of transactions for the given period including period boundaries.
   * @param int $from_date start of the period in timestamp.
   * @param int $to_date end of the period in timestamp.
   * @return array list of found transactions converted into report format for send as a response.
   */
  public async report(from_date: number, to_date: number) {
    const from_date_str = Format.timestamp2datetime(from_date);
    const to_date_str = Format.timestamp2datetime(to_date);

    // container to hold rows/document from data store
    const manager = getManager();

    const rows = await manager.find(TransactionEntity, {
      order: {
        paycom_time_datetime: "ASC",
      },
      where: {
        paycom_time_datetime: Between(from_date_str, to_date_str),
      },
    });

    // $sql = "SELECT * FROM transactions
    //         WHERE paycom_time_datetime BETWEEN :from_date AND :to_date
    //         ORDER BY paycom_time_datetime";

    // assume, here we have $rows variable that is populated with transactions from data store
    // normalize data for response
    const result = [];
    for (const row of rows) {
      result.push({
        id: row["paycom_transaction_id"], // paycom transaction id
        time: row["paycom_time"], // paycom transaction timestamp as is
        amount: row["amount"],
        account: {
          order_id: row["order_id"], // account parameters to identify client/order/service
          // ... additional parameters may be listed here, which are belongs to the account
        },
        create_time: Format.datetime2timestamp(row["create_time"]),
        perform_time: Format.datetime2timestamp(row["perform_time"]),
        cancel_time: Format.datetime2timestamp(row["cancel_time"]),
        transaction: row["id"],
        state: row["state"],
        reason: row["reason"] ? row["reason"] : null,
        receivers: row["receivers"]
          ? JSON.parse(row["receivers"] ?? "{}")
          : null,
      });
    }

    return result;
  }
}
