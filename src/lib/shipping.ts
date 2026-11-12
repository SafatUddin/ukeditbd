export const shippingFor = (subtotal: number, city?: string) =>
  subtotal === 0 ? 0 : city && city.trim().toLowerCase() !== "dhaka" ? 150 : 80;
