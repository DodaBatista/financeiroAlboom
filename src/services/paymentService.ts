import { callAPI } from "../utils/api";

export type PaymentType = {
  id: string;
  name: string;
  active: string;
};

export const paymentService = {
  async fetchPaymentTypes(): Promise<PaymentType[]> {
    const response = await callAPI("categories/payments", null, "GET");
    return (response || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      active: item.active,
    }));
  },
};
