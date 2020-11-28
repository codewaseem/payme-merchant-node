// declare module "mhtml2html" {
//   function convert(data: string, any);
// }

declare type RequestParams = {
  id: string;
  amount: number;
  request_id: number | null;
  account: { [key: string]: any };
  time: number;
  reason: number;
  password: string;
  from: number;
  to: number;
  order_id: any;
};
