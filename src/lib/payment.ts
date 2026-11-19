export const PREORDER_ADVANCE_PERCENT = 20;

export function preorderAdvanceFor(total: number): number {
  return Math.ceil((total * PREORDER_ADVANCE_PERCENT) / 100);
}

export function computePaymentAmounts(total: number, hasPreorder: boolean, method: "COD" | "BKASH" | "SSLCOMMERZ" | "CARD") {
  if (method === "COD") {
    return { upfront: 0, dueOnDelivery: total };
  }
  if (hasPreorder) {
    const upfront = preorderAdvanceFor(total);
    return { upfront, dueOnDelivery: Math.max(0, total - upfront) };
  }
  return { upfront: total, dueOnDelivery: 0 };
}

export function paymentMethodLabel(method: string, gateway?: string | null): string {
  if (gateway) return gateway;
  switch (method) {
    case "COD":
      return "Cash on Delivery";
    case "BKASH":
      return "bKash (SSLCommerz)";
    case "SSLCOMMERZ":
      return "SSLCommerz (bKash / Nagad / Cards)";
    case "CARD":
      return "Card";
    default:
      return method;
  }
}
