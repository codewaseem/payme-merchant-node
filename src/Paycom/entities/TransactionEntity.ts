/**
 * Class Transaction
 *
 * Example MySQL table might look like to the following:
 *
 * CREATE TABLE `transactions` (
 *   `id` INT(11) NOT NULL AUTO_INCREMENT,
 *   `paycom_transaction_id` VARCHAR(25) NOT NULL COLLATE 'utf8_unicode_ci',
 *   `paycom_time` VARCHAR(13) NOT NULL COLLATE 'utf8_unicode_ci',
 *   `paycom_time_datetime` DATETIME NOT NULL,
 *   `create_time` DATETIME NOT NULL,
 *   `perform_time` DATETIME NULL DEFAULT NULL,
 *   `cancel_time` DATETIME NULL DEFAULT NULL,
 *   `amount` INT(11) NOT NULL,
 *   `state` TINYINT(2) NOT NULL,
 *   `reason` TINYINT(2) NULL DEFAULT NULL,
 *   `receivers` VARCHAR(500) NULL DEFAULT NULL COMMENT 'JSON array of receivers' COLLATE 'utf8_unicode_ci',
 *   `order_id` INT(11) NOT NULL,
 *
 *   PRIMARY KEY (`id`)
 * )
 *   COLLATE='utf8_unicode_ci'
 *   ENGINE=InnoDB
 *   AUTO_INCREMENT=1;
 *
 */
import { Column, Entity, ObjectID, ObjectIdColumn } from "typeorm";

@Entity()
export default class TransactionEntity {
  @ObjectIdColumn()
  id!: ObjectID;

  @Column({
    length: 25,
    collation: "utf8_unicode_ci",
  })
  paycom_transaction_id!: string;

  @Column({
    length: 13,
    collation: "utf8_unicode_ci",
  })
  paycom_time!: string;

  @Column({
    type: "datetime",
  })
  paycom_time_datetime!: string;

  @Column({
    type: "datetime",
  })
  create_time!: string | null;

  @Column({
    type: "datetime",
    nullable: true,
    default: null,
  })
  perform_time!: string | null;

  @Column({
    type: "datetime",
    nullable: true,
    default: null,
  })
  cancel_time!: string | null;

  @Column({
    type: "int",
    length: 11,
  })
  amount!: number;

  @Column({
    type: "tinyint",
  })
  state!: number;

  @Column({
    type: "tinyint",
    nullable: true,
  })
  reason!: number | null;

  @Column({
    type: "varchar",
    length: 500,
    nullable: true,
    default: null,
    collation: "utf8_unicode_ci",
  })
  receivers!: string | null;

  @Column({
    type: "int",
    length: 11,
  })
  order_id!: number;
}
