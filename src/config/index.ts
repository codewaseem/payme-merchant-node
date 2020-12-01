import dotenv from "dotenv";
dotenv.config();

export default {
  PORT: Number(process.env.APP_PORT) || 1338,
};
