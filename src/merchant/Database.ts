import { createConnection, Connection } from "typeorm";
import paycomConfig from "../paycom.config";
import OrderEntity from "./entities/OrderEntity";
import TransactionEntity from "./entities/TransactionEntity";

export default class Database {
  private static instance: Database;

  private dbConnection!: Connection;

  private constructor() {
    //
  }

  async connect(): Promise<void> {
    // connect to the database

    this.dbConnection = await createConnection({
      type: "mongodb",
      url: paycomConfig.db.url,
      synchronize: true,
      entities: [OrderEntity, TransactionEntity],
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }

  /**
   * Connects to the database
   * @return null|\PDO connection
   */
  static async db(): Promise<Connection> {
    if (!this.instance) {
      this.instance = new Database();
      await this.instance.connect();
    }

    return this.instance.dbConnection;
  }
}
