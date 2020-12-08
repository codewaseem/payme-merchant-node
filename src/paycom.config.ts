import dotenv from "dotenv";
dotenv.config();

const paycomConfig = {
  merchant_id: process.env.MERCHANT_ID,
  login: "Paycom",
  keyFile: "password.paycom",
  db: {
    url:
      "mongodb+srv://Akros:yw1QHoLtyOUlM6XT@cluster0.3brqs.mongodb.net/Akros?retryWrites=true&w=majority",
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 27017,
  },
};

export default paycomConfig;
