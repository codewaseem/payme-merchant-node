import dotenv from "dotenv";
dotenv.config();

const paycomConfig = {
  merchant_id: process.env.MERCHANT_ID,
  login: "Paycom",
  keyFile: "password.paycom",
  db: {
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 27017,
  },
};

export default paycomConfig;
