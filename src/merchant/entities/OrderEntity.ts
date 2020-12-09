import { Column, Entity, ObjectID, ObjectIdColumn } from "typeorm";

/**
 * Class Order
 *
 * Example MySQL table might look like to the following:
 *
 * CREATE TABLE orders
 * (
 *     id          INT AUTO_INCREMENT PRIMARY KEY,
 *     product_ids VARCHAR(255)   NOT NULL,
 *     amount      DECIMAL(18, 2) NOT NULL,
 *     state       TINYINT(1)     NOT NULL,
 *     user_id     INT            NOT NULL,
 *     phone       VARCHAR(15)    NOT NULL
 * ) ENGINE = InnoDB;
 *
 */

@Entity()
export default class OrderEntity {
  @ObjectIdColumn()
  id!: ObjectID;

  @Column()
  product_ids!: string;

  @Column({
    type: "decimal",
    length: 18,
    precision: 2,
  })
  amount!: number;

  @Column({
    type: "tinyint",
  })
  state!: number;

  @Column({
    type: "int",
  })
  user_id!: number;

  @Column({
    type: "varchar",
    length: 15,
  })
  phone!: string;
}
