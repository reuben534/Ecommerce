export function createPaymentReference() {
  return `manual_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}