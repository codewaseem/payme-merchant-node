import dayjs from "dayjs";

export default class Format {
  /**
   * Converts coins to som.
   * @param int|string $coins coins.
   * @return float coins converted to som.
   */
  public static toSom(coins: number) {
    return (1 * coins) / 100;
  }

  /**
   * Converts som to coins.
   * @param float $amount
   * @return int
   */
  public static toCoins($amount: number) {
    return Math.round(1 * $amount * 100);
  }

  /**
   * Get current timestamp in seconds or milliseconds.
   * @param bool $milliseconds true - get timestamp in milliseconds, false - in seconds.
   * @return int current timestamp value
   */
  public static timestamp(milliseconds = false) {
    if (milliseconds) {
      return Date.now(); // milliseconds
    }

    return Math.floor(Date.now() / 1000); // seconds
  }

  /**
   * Converts timestamp value from milliseconds to seconds.
   * @param int $timestamp timestamp in milliseconds.
   * @return int timestamp in seconds.
   */
  public static timestamp2seconds(timestamp: number) {
    // is it already as seconds
    if (String(timestamp).length == 10) {
      return timestamp;
    }
    return Math.floor(timestamp / 1000);
  }

  /**
   * Converts timestamp value from seconds to milliseconds.
   * @param int $timestamp timestamp in seconds.
   * @return int timestamp in milliseconds.
   */
  public static timestamp2milliseconds(timestamp: number) {
    // is it already as milliseconds
    if (String(timestamp).length == 13) {
      return timestamp;
    }

    return timestamp * 1000;
  }

  /**
   * Converts timestamp to date time string.
   * @param int $timestamp timestamp value as seconds or milliseconds.
   * @return string string representation of the timestamp value in 'Y-m-d H:i:s' format.
   */
  public static timestamp2datetime(timestamp: number) {
    // if as milliseconds, convert to seconds
    if (String(timestamp).length == 13) {
      timestamp = this.timestamp2seconds(timestamp);
    }

    // convert to datetime string
    return dayjs(timestamp).format("Y-m-d H:i:s");
  }

  /**
   * Converts date time string to timestamp value.
   * @param string $datetime date time string.
   * @return int timestamp as milliseconds.
   */
  public static datetime2timestamp(datetime: string): number {
    return dayjs(datetime).valueOf();
  }
}
