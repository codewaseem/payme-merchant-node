import { createConnection, Connection } from "typeorm";
import paycomConfig from "../paycom.config";
import Order from "./Order";

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
      host: paycomConfig.db.host,
      database: paycomConfig.db.database,
      port: paycomConfig.db.port,
      synchronize: true,
      entities: [Order],
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
