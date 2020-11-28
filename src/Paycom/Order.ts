import { getManager } from "typeorm";
import OrderEntity from "./entities/OrderEntity";
import PaycomException from "./PaycomException";

enum OrderState {
  STATE_AVAILABLE,
  STATE_WAITING_PAY,
  STATE_PAY_ACCEPTED,
  STATE_CANCELLED,
}

export default class Order extends OrderEntity {
  constructor(private request_id: number | null) {
    super();
  }

  //     /**
  //      * Validates amount and account values.
  //      * @param array $params amount and account parameters to validate.
  //      * @return bool true - if validation passes
  //      * @throws PaycomException - if validation fails
  //      */
  public async validate(params: any): Promise<void> {
    // todo: Validate amount, if failed throw error
    // for example, check amount is numeric
    if (!is_numeric(params["amount"])) {
      throw new PaycomException(
        this.request_id,
        "Incorrect amount.",
        PaycomException.ERROR_INVALID_AMOUNT
      );
    }

    // todo: Validate account, if failed throw error
    // assume, we should have order_id
    if (!params["account"]["order_id"]) {
      throw new PaycomException(
        this.request_id,
        PaycomException.message(
          "Неверный код заказа.",
          "Harid kodida xatolik.",
          "Incorrect order code."
        ),
        PaycomException.ERROR_INVALID_ACCOUNT,
        "order_id"
      );
    }

    // todo: Check is order available

    // assume, after find() $this will be populated with Order data
    const manager = getManager();
    const order = await manager.findOne(OrderEntity);

    // Check, is order found by specified order_id
    if (!order || !order.id) {
      throw new PaycomException(
        this.request_id,
        PaycomException.message(
          "Неверный код заказа.",
          "Harid kodida xatolik.",
          "Incorrect order code."
        ),
        PaycomException.ERROR_INVALID_ACCOUNT,
        "order_id"
      );
    }

    // validate amount
    // convert $this->amount to coins
    // $params['amount'] already in coins
    if (100 * this.amount != Number(params["amount"])) {
      throw new PaycomException(
        this.request_id,
        "Incorrect amount.",
        PaycomException.ERROR_INVALID_AMOUNT
      );
    }

    // for example, order state before payment should be 'waiting pay'
    if (this.state != OrderState.STATE_WAITING_PAY) {
      throw new PaycomException(
        this.request_id,
        "Order state is invalid.",
        PaycomException.ERROR_COULD_NOT_PERFORM
      );
    }
  }

  /**
   * Find order by given parameters.
   * @param mixed $params parameters.
   * @return Order|Order[] found order or array of orders.
   */
  public async find(params: any): Promise<Order | null> {
    // todo: Implement searching order(s) by given parameters, populate current instance with data

    // Example implementation to load order by id
    if (params["order_id"]) {
      const manager = getManager();

      const order = await manager.findOne(OrderEntity, {
        id: params["order_id"],
      });

      if (!order) return null;

      this.id = order.id;
      this.amount = order.amount;
      this.product_ids = JSON.parse(order.product_ids);
      this.state = order.state;
      this.user_id = order.user_id;
      this.phone = order.phone;

      return this;
    } else return null;
  }

  /**
   * Change order's state to specified one.
   * @param int $state new state of the order
   * @return void
   */
  public async changeState(state: number): Promise<void> {
    // todo: Implement changing order state (reserve order after create transaction or free order after cancel)

    // Example implementation
    if (is_numeric(state)) {
      this.state = Number(state);
      await this.save();
    }
  }

  /**
   * Check, whether order can be cancelled or not.
   * @return bool true - order is cancellable, otherwise false.
   */
  public allowCancel() {
    // todo: Implement order cancelling allowance check

    // Example implementation
    return false; // do not allow cancellation
  }

  /**
   * Saves this order.
   * @throws PaycomException
   */
  public async save(): Promise<void> {
    try {
      const manager = getManager();

      if (!this.id) {
        // If new order, set its state to waiting
        this.state = OrderState.STATE_WAITING_PAY;

        // todo: Set customer ID
        // $this->user_id = 1 * SomeSessionManager::get('user_id');

        const savedOrder = await manager.save({
          ...this,
          product_ids: JSON.stringify(this.product_ids),
        });
        this.id = savedOrder.id;
      } else {
        await manager.update(
          OrderEntity,
          {
            id: this.id,
          },
          {
            state: this.state,
          }
        );
      }
    } catch (e) {
      throw new PaycomException(
        this.request_id,
        "Could not save order.",
        PaycomException.ERROR_INTERNAL_SYSTEM
      );
    }
  }
}

function is_numeric(number: any) {
  const n = Number(number);
  if (typeof n == "number" && !Number.isNaN(n) && Number.isFinite(n)) {
    return true;
  }

  return false;
}
