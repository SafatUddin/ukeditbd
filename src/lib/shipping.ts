export const FREE_SHIPPING_THRESHOLD = 10000;

export const shippingFor = (subtotal: number, city?: string) =>
  subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : city && city.trim().toLowerCase() !== "dhaka" ? 150 : 80;
