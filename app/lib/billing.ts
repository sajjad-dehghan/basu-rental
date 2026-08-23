export type DeliveryMethod = "pickup" | "delivery";
export type DeliveryQuoteStatus = "pending" | "finalized" | null;

type InvoiceInput = {
  subtotalThousands: number | null;
  deliveryMethod: DeliveryMethod;
  deliveryQuoteStatus?: DeliveryQuoteStatus;
  deliveryFeeThousands?: number | null;
};

export function finalInvoiceTotalThousands(input: InvoiceInput): number | null {
  if (input.subtotalThousands === null) return null;
  if (input.deliveryMethod === "pickup") return input.subtotalThousands;
  if (
    input.deliveryQuoteStatus !== "finalized" ||
    input.deliveryFeeThousands === null ||
    input.deliveryFeeThousands === undefined
  )
    return null;
  return input.subtotalThousands + input.deliveryFeeThousands;
}

export function invoiceRequiresReview(input: InvoiceInput): boolean {
  return finalInvoiceTotalThousands(input) === null;
}
