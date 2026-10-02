export type PaymentType = "success" | "failure" | "pending";

export function paymentTypeFromStatus(status?: string | null): PaymentType {
  switch (status) {
    case "PAID":
      return "success";
    case "FAILED":
    case "CANCELLED":
    case "REFUNDED":
      return "failure";
    default:
      return "pending";
  }
}

export function paymentTypeFromOrderStatus(
  status?: string,
): PaymentType | null {
  switch (status) {
    case "CONFIRMED":
      return "success";
    case "CANCELLED":
      return "failure";
    default:
      return null;
  }
}
