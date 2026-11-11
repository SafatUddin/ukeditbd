export type OrderStatusValue = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";

export const orderTransitions: Record<OrderStatusValue, OrderStatusValue[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export const orderStatusMessages: Record<OrderStatusValue, string> = {
  PENDING: "Order placed",
  CONFIRMED: "Order confirmed",
  PROCESSING: "Packed and ready to ship",
  SHIPPED: "Handed to courier",
  DELIVERED: "Delivered to customer",
  CANCELLED: "Order cancelled",
  REFUNDED: "Order refunded",
};

export const orderStatuses = Object.keys(orderTransitions) as OrderStatusValue[];
