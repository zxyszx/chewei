export const paymentMethodLabels: Record<string, string> = {
  WECHAT: "微信",
  ALIPAY: "支付宝口令",
  CRYPTO: "虚拟货币",
  CARD: "信用卡（历史）",
  CASH: "现金（历史）",
  OTHER: "其他（历史）",
};

export const currentPaymentMethods = [
  { value: "WECHAT", label: "微信" },
  { value: "ALIPAY", label: "支付宝口令" },
  { value: "CRYPTO", label: "虚拟货币" },
] as const;

export type CurrentPaymentMethod = (typeof currentPaymentMethods)[number]["value"];
export const allPaymentMethods = [
  "WECHAT",
  "ALIPAY",
  "CRYPTO",
  "CARD",
  "CASH",
  "OTHER",
] as const;
export type PaymentMethodValue = (typeof allPaymentMethods)[number];

export function isPaymentMethod(value: string): value is PaymentMethodValue {
  return allPaymentMethods.some((method) => method === value);
}
